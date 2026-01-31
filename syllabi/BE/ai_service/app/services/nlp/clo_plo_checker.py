"""CLO-PLO Alignment Checker Service"""
import logging
from typing import Optional
import numpy as np

from app.services.embeddings import get_embedding_service
from app.services.nlp.llm_provider import get_llm_provider
from app.schemas.clo_plo import (
    CLOInput, PLOInput, CLOPLOMapping, CLOPLOCheckResult, AlignmentLevel
)

logger = logging.getLogger(__name__)


class CLOPLOChecker:
    """Service for checking CLO-PLO alignment"""

    def __init__(self):
        self.embedding_service = get_embedding_service()
        self.llm_provider = get_llm_provider()

    def _get_alignment_level(self, score: float) -> AlignmentLevel:
        """Determine alignment level from similarity score"""
        if score >= 0.85:
            return AlignmentLevel.STRONG
        elif score >= 0.70:
            return AlignmentLevel.MODERATE
        elif score >= 0.50:
            return AlignmentLevel.WEAK
        else:
            return AlignmentLevel.NONE

    async def check_alignment(
        self,
        syllabus_id: int,
        program_id: int,
        clos: list[CLOInput],
        plos: list[PLOInput]
    ) -> CLOPLOCheckResult:
        """
        Check alignment between CLOs and PLOs using semantic similarity.
        """
        logger.info(f"Checking CLO-PLO alignment for syllabus {syllabus_id}")

        # Extract texts
        clo_texts = [clo.text for clo in clos]
        plo_texts = [plo.text for plo in plos]

        # Compute similarity matrix using embeddings (local model)
        similarity_matrix = self.embedding_service.compute_similarity_matrix(
            clo_texts, plo_texts
        )

        # Create mappings for each CLO to its best matching PLO(s)
        mappings: list[CLOPLOMapping] = []
        unmapped_clos: list[int] = []

        for i, clo in enumerate(clos):
            # Find best matching PLO
            best_plo_idx = int(np.argmax(similarity_matrix[i]))
            best_score = float(similarity_matrix[i][best_plo_idx])
            alignment_level = self._get_alignment_level(best_score)

            # Track unmapped CLOs
            if alignment_level in [AlignmentLevel.WEAK, AlignmentLevel.NONE]:
                unmapped_clos.append(clo.index)

            # Add all significant mappings (above weak threshold)
            for j, plo in enumerate(plos):
                score = float(similarity_matrix[i][j])
                if score >= 0.50:  # Include weak and above
                    mappings.append(CLOPLOMapping(
                        clo_index=clo.index,
                        clo_text=clo.text,
                        plo_index=plo.index,
                        plo_text=plo.text,
                        similarity_score=round(score, 3),
                        alignment_level=self._get_alignment_level(score)
                    ))

        # Calculate coverage score
        strong_moderate_count = sum(
            1 for clo in clos
            if any(
                m.clo_index == clo.index and m.alignment_level in [AlignmentLevel.STRONG, AlignmentLevel.MODERATE]
                for m in mappings
            )
        )
        coverage_score = strong_moderate_count / len(clos) if clos else 0

        # Generate AI suggestions using hybrid LLM
        suggestions = await self._generate_suggestions(
            clos, plos, mappings, unmapped_clos
        )

        return CLOPLOCheckResult(
            syllabus_id=syllabus_id,
            program_id=program_id,
            total_clos=len(clos),
            total_plos=len(plos),
            mappings=sorted(mappings, key=lambda x: (x.clo_index, -x.similarity_score)),
            coverage_score=round(coverage_score, 2),
            unmapped_clos=unmapped_clos,
            suggestions=suggestions
        )

    async def _generate_suggestions(
        self,
        clos: list[CLOInput],
        plos: list[PLOInput],
        mappings: list[CLOPLOMapping],
        unmapped_clos: list[int]
    ) -> list[str]:
        """Generate AI suggestions for improving CLO-PLO alignment"""
        if not unmapped_clos:
            return ["All CLOs have strong or moderate alignment with PLOs. No changes recommended."]

        # Prepare context for LLM
        unmapped_texts = [clo.text for clo in clos if clo.index in unmapped_clos]
        plo_texts = [plo.text for plo in plos]

        prompt = f"""Analyze the following Course Learning Outcomes (CLOs) that have weak or no alignment with Program Learning Outcomes (PLOs).

Unmapped/Weakly Aligned CLOs:
{chr(10).join(f"- CLO {unmapped_clos[i]}: {text}" for i, text in enumerate(unmapped_texts))}

Available PLOs:
{chr(10).join(f"- PLO {i+1}: {text}" for i, text in enumerate(plo_texts))}

Please provide 3-5 specific suggestions to improve the alignment. Consider:
1. How to revise CLO wording to better connect with PLOs
2. Which PLOs might be missing from the program
3. Whether these CLOs should be in this course

Format your response as a numbered list of actionable suggestions."""

        system_prompt = """You are an academic curriculum expert specializing in outcome-based education.
Provide clear, actionable suggestions for improving Course Learning Outcome (CLO) and Program Learning Outcome (PLO) alignment.
Be specific and practical in your recommendations."""

        try:
            response, provider = await self.llm_provider.generate(prompt, system_prompt)
            logger.info(f"Generated suggestions using {provider}")

            # Parse response into list
            suggestions = []
            for line in response.strip().split("\n"):
                line = line.strip()
                if line and (line[0].isdigit() or line.startswith("-")):
                    # Remove numbering/bullets
                    clean = line.lstrip("0123456789.-) ").strip()
                    if clean:
                        suggestions.append(clean)

            return suggestions[:5] if suggestions else ["Review unmapped CLOs for potential revision."]

        except Exception as e:
            logger.error(f"Failed to generate suggestions: {e}")
            return [
                f"CLOs {unmapped_clos} have weak alignment with program outcomes.",
                "Consider revising these CLOs to better match PLO language and objectives.",
                "Consult with program coordinator about curriculum alignment."
            ]

    async def find_similar_clos(
        self,
        clo_text: str,
        all_clos: list[dict],
        top_k: int = 5
    ) -> list[dict]:
        """Find similar CLOs from other courses"""
        if not all_clos:
            return []

        clo_texts = [c["text"] for c in all_clos]
        similar_indices = self.embedding_service.find_most_similar(
            clo_text, clo_texts, top_k
        )

        results = []
        for idx, score in similar_indices:
            if score > 0.5:  # Only include reasonably similar
                results.append({
                    **all_clos[idx],
                    "similarity_score": round(score, 3)
                })

        return results


# Singleton
_checker: Optional[CLOPLOChecker] = None


def get_clo_plo_checker() -> CLOPLOChecker:
    global _checker
    if _checker is None:
        _checker = CLOPLOChecker()
    return _checker
