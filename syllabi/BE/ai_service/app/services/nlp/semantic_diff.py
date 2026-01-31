"""Semantic Diff Service for comparing syllabus versions"""
import logging
from typing import Optional
import re

from app.services.embeddings import get_embedding_service
from app.services.nlp.llm_provider import get_llm_provider
from app.schemas.semantic import (
    SemanticDiffResult, SectionChange, ChangeType, ChangeSignificance
)

logger = logging.getLogger(__name__)


class SemanticDiffService:
    """Service for semantic comparison of syllabus versions"""

    SYLLABUS_SECTIONS = [
        "learning_outcomes",
        "assessment_methods",
        "textbooks",
        "teaching_methods",
        "prerequisites",
        "materials",
        "credits",
        "total_hours"
    ]

    def __init__(self):
        self.embedding_service = get_embedding_service()
        self.llm_provider = get_llm_provider()

    def _get_significance(self, similarity: float, change_type: ChangeType) -> ChangeSignificance:
        """Determine significance of change based on similarity and type"""
        if change_type == ChangeType.UNCHANGED:
            return ChangeSignificance.NONE

        if change_type in [ChangeType.ADDED, ChangeType.REMOVED]:
            return ChangeSignificance.MAJOR

        # For modifications
        if similarity >= 0.95:
            return ChangeSignificance.COSMETIC
        elif similarity >= 0.80:
            return ChangeSignificance.MINOR
        else:
            return ChangeSignificance.MAJOR

    def _determine_change_type(
        self,
        old_content: Optional[str],
        new_content: Optional[str]
    ) -> ChangeType:
        """Determine the type of change between old and new content"""
        old_empty = not old_content or old_content.strip() == ""
        new_empty = not new_content or new_content.strip() == ""

        if old_empty and new_empty:
            return ChangeType.UNCHANGED
        elif old_empty and not new_empty:
            return ChangeType.ADDED
        elif not old_empty and new_empty:
            return ChangeType.REMOVED
        elif old_content.strip() == new_content.strip():
            return ChangeType.UNCHANGED
        else:
            return ChangeType.MODIFIED

    async def compare_versions(
        self,
        syllabus_id: int,
        version_old: int,
        version_new: int,
        old_content: dict,
        new_content: dict,
        sections: Optional[list[str]] = None
    ) -> SemanticDiffResult:
        """
        Compare two syllabus versions semantically.

        Args:
            syllabus_id: Syllabus ID
            version_old: Old version number
            version_new: New version number
            old_content: Dict with section content from old version
            new_content: Dict with section content from new version
            sections: Optional list of sections to compare
        """
        logger.info(f"Comparing syllabus {syllabus_id} versions {version_old} -> {version_new}")

        sections_to_compare = sections or self.SYLLABUS_SECTIONS
        section_changes: list[SectionChange] = []

        # Compare each section
        for section in sections_to_compare:
            old_text = old_content.get(section, "")
            new_text = new_content.get(section, "")

            change_type = self._determine_change_type(old_text, new_text)

            if change_type == ChangeType.UNCHANGED:
                section_changes.append(SectionChange(
                    section=section,
                    change_type=change_type,
                    significance=ChangeSignificance.NONE,
                    old_content=old_text,
                    new_content=new_text,
                    semantic_similarity=1.0,
                    change_summary="No changes"
                ))
                continue

            # Calculate semantic similarity for modified content
            similarity = 0.0
            if change_type == ChangeType.MODIFIED and old_text and new_text:
                similarity = self.embedding_service.compute_similarity(old_text, new_text)

            significance = self._get_significance(similarity, change_type)

            # Generate change summary for significant changes
            change_summary = await self._generate_section_summary(
                section, old_text, new_text, change_type
            )

            section_changes.append(SectionChange(
                section=section,
                change_type=change_type,
                significance=significance,
                old_content=old_text if change_type != ChangeType.ADDED else None,
                new_content=new_text if change_type != ChangeType.REMOVED else None,
                semantic_similarity=round(similarity, 3),
                change_summary=change_summary
            ))

        # Calculate overall similarity
        modified_sections = [
            s for s in section_changes
            if s.change_type == ChangeType.MODIFIED
        ]
        if modified_sections:
            overall_similarity = sum(s.semantic_similarity for s in modified_sections) / len(modified_sections)
        else:
            unchanged = sum(1 for s in section_changes if s.change_type == ChangeType.UNCHANGED)
            overall_similarity = unchanged / len(section_changes) if section_changes else 1.0

        # Determine overall significance
        significances = [s.significance for s in section_changes]
        if ChangeSignificance.MAJOR in significances:
            overall_significance = ChangeSignificance.MAJOR
        elif ChangeSignificance.MINOR in significances:
            overall_significance = ChangeSignificance.MINOR
        elif ChangeSignificance.COSMETIC in significances:
            overall_significance = ChangeSignificance.COSMETIC
        else:
            overall_significance = ChangeSignificance.NONE

        # Generate overall summary and key changes
        change_summary, key_changes, impact = await self._generate_overall_summary(
            section_changes, overall_significance
        )

        return SemanticDiffResult(
            syllabus_id=syllabus_id,
            version_old=version_old,
            version_new=version_new,
            overall_similarity=round(overall_similarity, 3),
            overall_significance=overall_significance,
            section_changes=section_changes,
            change_summary=change_summary,
            key_changes=key_changes,
            impact_analysis=impact
        )

    async def _generate_section_summary(
        self,
        section: str,
        old_text: str,
        new_text: str,
        change_type: ChangeType
    ) -> str:
        """Generate a brief summary of section changes"""
        if change_type == ChangeType.ADDED:
            return f"New {section.replace('_', ' ')} section added"
        elif change_type == ChangeType.REMOVED:
            return f"{section.replace('_', ' ').title()} section removed"
        elif change_type == ChangeType.UNCHANGED:
            return "No changes"

        # For modifications, use LLM to summarize
        prompt = f"""Compare these two versions of a syllabus {section.replace('_', ' ')} section and describe the key changes in 1-2 sentences.

OLD VERSION:
{old_text[:500]}

NEW VERSION:
{new_text[:500]}

Describe what changed concisely:"""

        try:
            response, _ = await self.llm_provider.generate(prompt)
            return response.strip()[:200]
        except Exception as e:
            logger.warning(f"Failed to generate section summary: {e}")
            return f"{section.replace('_', ' ').title()} content was modified"

    async def _generate_overall_summary(
        self,
        section_changes: list[SectionChange],
        significance: ChangeSignificance
    ) -> tuple[str, list[str], Optional[str]]:
        """Generate overall summary, key changes, and impact analysis"""

        # Collect significant changes
        significant_changes = [
            s for s in section_changes
            if s.significance in [ChangeSignificance.MAJOR, ChangeSignificance.MINOR]
        ]

        if not significant_changes:
            return (
                "Minor cosmetic changes only. No significant updates to syllabus content.",
                [],
                None
            )

        changes_text = "\n".join([
            f"- {s.section}: {s.change_summary}"
            for s in significant_changes
        ])

        prompt = f"""Based on these syllabus changes, provide:
1. A brief overall summary (2-3 sentences)
2. A list of 3-5 key bullet points highlighting the most important changes
3. A brief impact analysis for students (1-2 sentences)

CHANGES DETECTED:
{changes_text}

Respond in this format:
SUMMARY: [your summary]
KEY CHANGES:
- [change 1]
- [change 2]
...
IMPACT: [impact analysis]"""

        try:
            response, _ = await self.llm_provider.generate(prompt)

            # Parse response
            summary = ""
            key_changes = []
            impact = None

            lines = response.strip().split("\n")
            current_section = None

            for line in lines:
                line = line.strip()
                if line.startswith("SUMMARY:"):
                    summary = line.replace("SUMMARY:", "").strip()
                    current_section = "summary"
                elif line.startswith("KEY CHANGES:"):
                    current_section = "changes"
                elif line.startswith("IMPACT:"):
                    impact = line.replace("IMPACT:", "").strip()
                    current_section = "impact"
                elif current_section == "summary" and not line.startswith("-"):
                    summary += " " + line
                elif current_section == "changes" and line.startswith("-"):
                    key_changes.append(line.lstrip("- ").strip())
                elif current_section == "impact" and line:
                    impact = (impact or "") + " " + line

            return (
                summary.strip() or "Syllabus content has been updated.",
                key_changes[:5] if key_changes else [s.change_summary for s in significant_changes[:5]],
                impact.strip() if impact else None
            )

        except Exception as e:
            logger.warning(f"Failed to generate overall summary: {e}")
            return (
                f"Syllabus has {len(significant_changes)} significant changes.",
                [s.change_summary for s in significant_changes[:5]],
                None
            )

    async def quick_diff(self, text_old: str, text_new: str) -> dict:
        """Quick semantic diff between two texts"""
        similarity = self.embedding_service.compute_similarity(text_old, text_new)
        change_type = self._determine_change_type(text_old, text_new)
        significance = self._get_significance(similarity, change_type)

        return {
            "similarity_score": round(similarity, 3),
            "significance": significance.value,
            "change_type": change_type.value
        }


# Singleton
_service: Optional[SemanticDiffService] = None


def get_semantic_diff_service() -> SemanticDiffService:
    global _service
    if _service is None:
        _service = SemanticDiffService()
    return _service
