"""AI Summarization Service"""
import logging
from typing import Optional
import re

from app.services.nlp.llm_provider import get_llm_provider
from app.schemas.summary import (
    SummarizeResult, SummaryLength, SummaryLanguage, SyllabusHighlight,
    KeywordExtractionResult, Keyword
)

logger = logging.getLogger(__name__)


class SummarizerService:
    """Service for AI-powered syllabus summarization"""

    LENGTH_TOKENS = {
        SummaryLength.SHORT: 100,
        SummaryLength.MEDIUM: 250,
        SummaryLength.DETAILED: 500
    }

    def __init__(self):
        self.llm_provider = get_llm_provider()

    async def summarize_syllabus(
        self,
        syllabus_id: int,
        version_id: Optional[int],
        course_code: str,
        course_name: str,
        content: dict,
        length: SummaryLength = SummaryLength.MEDIUM,
        language: SummaryLanguage = SummaryLanguage.EN,
        target_audience: str = "student"
    ) -> SummarizeResult:
        """Generate AI summary of syllabus content"""
        logger.info(f"Summarizing syllabus {syllabus_id} for {target_audience}")

        # Prepare content for summarization
        content_text = self._prepare_content(content)
        word_limit = self.LENGTH_TOKENS[length]

        # Generate main summary
        summary_en = await self._generate_summary(
            content_text, course_name, word_limit, target_audience, "English"
        )

        summary_vi = None
        if language in [SummaryLanguage.VI, SummaryLanguage.BOTH]:
            summary_vi = await self._generate_summary(
                content_text, course_name, word_limit, target_audience, "Vietnamese"
            )

        if language == SummaryLanguage.VI:
            summary_en = summary_vi
            summary_vi = None

        # Generate structured highlights
        highlights = await self._extract_highlights(content, course_name)

        # Generate section-specific summaries
        lo_summary = await self._summarize_section(
            content.get("learning_outcomes", ""),
            "learning outcomes",
            100
        )

        assessment_summary = await self._summarize_section(
            content.get("assessment_methods", ""),
            "assessment methods",
            100
        )

        prereq_summary = None
        if content.get("prerequisites"):
            prereq_summary = await self._summarize_section(
                content["prerequisites"],
                "prerequisites",
                50
            )

        # Determine difficulty and workload
        difficulty = self._estimate_difficulty(content)
        workload = self._estimate_workload(content)

        # Recommend target students
        recommendations = await self._generate_recommendations(content, course_name)

        return SummarizeResult(
            syllabus_id=syllabus_id,
            version_id=version_id,
            course_code=course_code,
            course_name=course_name,
            summary=summary_en,
            summary_vi=summary_vi,
            key_highlights=highlights,
            prerequisites_summary=prereq_summary,
            learning_outcomes_summary=lo_summary,
            assessment_summary=assessment_summary,
            recommended_for=recommendations,
            difficulty_level=difficulty,
            estimated_workload=workload
        )

    def _prepare_content(self, content: dict) -> str:
        """Prepare content dict as text for summarization"""
        sections = []

        if content.get("learning_outcomes"):
            sections.append(f"LEARNING OUTCOMES:\n{content['learning_outcomes']}")

        if content.get("assessment_methods"):
            sections.append(f"ASSESSMENT:\n{content['assessment_methods']}")

        if content.get("teaching_methods"):
            sections.append(f"TEACHING METHODS:\n{content['teaching_methods']}")

        if content.get("textbooks"):
            sections.append(f"TEXTBOOKS:\n{content['textbooks']}")

        if content.get("prerequisites"):
            sections.append(f"PREREQUISITES:\n{content['prerequisites']}")

        return "\n\n".join(sections)

    async def _generate_summary(
        self,
        content: str,
        course_name: str,
        word_limit: int,
        audience: str,
        language: str
    ) -> str:
        """Generate summary using LLM"""
        prompt = f"""Summarize the following course syllabus for {course_name} in approximately {word_limit} words.

Target audience: {audience}
Language: {language}

SYLLABUS CONTENT:
{content[:3000]}

Write a clear, engaging summary that helps {audience}s understand what this course is about, what they will learn, and what to expect. Focus on practical information."""

        system_prompt = f"""You are an educational content specialist creating course summaries.
Write in {language} language.
Be concise, informative, and student-friendly.
Focus on key learning outcomes, skills gained, and practical applications."""

        try:
            response, provider = await self.llm_provider.generate(prompt, system_prompt)
            logger.info(f"Generated summary using {provider}")
            return response.strip()
        except Exception as e:
            logger.error(f"Failed to generate summary: {e}")
            return f"This course covers {course_name}. Please review the full syllabus for details."

    async def _summarize_section(self, content: str, section_name: str, word_limit: int) -> str:
        """Summarize a specific section"""
        if not content or content.strip() == "":
            return f"No {section_name} specified."

        prompt = f"""Summarize these {section_name} in {word_limit} words or less:

{content[:1000]}

Be concise and highlight the key points."""

        try:
            response, _ = await self.llm_provider.generate(prompt)
            return response.strip()[:500]
        except Exception:
            return content[:200] + "..." if len(content) > 200 else content

    async def _extract_highlights(self, content: dict, course_name: str) -> list[SyllabusHighlight]:
        """Extract key highlights from syllabus"""
        highlights = []

        # Credits and hours
        if content.get("credits"):
            highlights.append(SyllabusHighlight(
                category="credits",
                content=f"{content['credits']} credits",
                importance="high"
            ))

        if content.get("total_hours"):
            highlights.append(SyllabusHighlight(
                category="workload",
                content=f"{content['total_hours']} total hours",
                importance="medium"
            ))

        # Extract from learning outcomes
        if content.get("learning_outcomes"):
            prompt = f"""Extract the 2-3 most important skills or competencies from these learning outcomes:

{content['learning_outcomes'][:500]}

List only the skill names, one per line."""

            try:
                response, _ = await self.llm_provider.generate(prompt)
                skills = [s.strip().lstrip("•-123456789. ") for s in response.split("\n") if s.strip()]
                for skill in skills[:3]:
                    highlights.append(SyllabusHighlight(
                        category="skill",
                        content=skill,
                        importance="high"
                    ))
            except Exception:
                pass

        # Assessment weights
        if content.get("assessment_methods"):
            methods = content["assessment_methods"]
            # Try to extract percentages
            weights = re.findall(r'(\w+(?:\s+\w+)?)\s*[:\-]?\s*(\d+)%', methods)
            for method, weight in weights[:3]:
                highlights.append(SyllabusHighlight(
                    category="assessment",
                    content=f"{method}: {weight}%",
                    importance="medium"
                ))

        return highlights

    def _estimate_difficulty(self, content: dict) -> str:
        """Estimate course difficulty based on content"""
        prereqs = content.get("prerequisites", "").lower()
        outcomes = content.get("learning_outcomes", "").lower()

        # Keywords indicating difficulty
        advanced_keywords = ["advanced", "complex", "sophisticated", "research", "phd", "graduate"]
        intermediate_keywords = ["intermediate", "build upon", "prior knowledge", "experience with"]

        text = prereqs + " " + outcomes

        if any(kw in text for kw in advanced_keywords):
            return "Advanced"
        elif any(kw in text for kw in intermediate_keywords):
            return "Intermediate"
        elif "none" in prereqs or "no prior" in prereqs or not prereqs.strip():
            return "Beginner"
        else:
            return "Intermediate"

    def _estimate_workload(self, content: dict) -> str:
        """Estimate weekly workload"""
        credits = content.get("credits", 3)
        total_hours = content.get("total_hours", 45)

        try:
            credits = int(credits)
            total_hours = int(total_hours)
        except (ValueError, TypeError):
            credits = 3
            total_hours = 45

        # Assume 15-week semester
        weekly_hours = total_hours / 15

        if weekly_hours <= 3:
            return f"~{weekly_hours:.0f} hours/week (Light)"
        elif weekly_hours <= 6:
            return f"~{weekly_hours:.0f} hours/week (Moderate)"
        else:
            return f"~{weekly_hours:.0f} hours/week (Heavy)"

    async def _generate_recommendations(self, content: dict, course_name: str) -> list[str]:
        """Generate recommendations for who should take this course"""
        prompt = f"""Based on this course information, who should take this course?

Course: {course_name}
Prerequisites: {content.get('prerequisites', 'None specified')}
Learning Outcomes: {content.get('learning_outcomes', '')[:300]}

List 2-3 types of students who would benefit from this course, one per line.
Be specific (e.g., "Computer Science majors interested in AI" not just "students")."""

        try:
            response, _ = await self.llm_provider.generate(prompt)
            recommendations = [
                r.strip().lstrip("•-123456789. ")
                for r in response.split("\n")
                if r.strip()
            ]
            return recommendations[:3] if recommendations else ["Students interested in this subject area"]
        except Exception:
            return ["Students meeting the prerequisites"]

    async def extract_keywords(
        self,
        syllabus_id: int,
        content: dict,
        top_k: int = 10
    ) -> KeywordExtractionResult:
        """Extract keywords and topics from syllabus"""
        full_text = self._prepare_content(content)

        prompt = f"""Extract keywords from this syllabus content and categorize them:

{full_text[:2000]}

Provide output in this exact format:
KEYWORDS: keyword1, keyword2, keyword3, ...
TOPICS: topic1, topic2, topic3, ...
SKILLS: skill1, skill2, skill3, ...
TOOLS: tool1, tool2, tool3, ..."""

        try:
            response, _ = await self.llm_provider.generate(prompt)

            keywords = []
            topics = []
            skills = []
            tools = []

            for line in response.split("\n"):
                line = line.strip()
                if line.startswith("KEYWORDS:"):
                    items = [k.strip() for k in line.replace("KEYWORDS:", "").split(",") if k.strip()]
                    keywords = [Keyword(term=k, score=1.0 - i*0.05, frequency=1, category="keyword")
                               for i, k in enumerate(items[:top_k])]
                elif line.startswith("TOPICS:"):
                    topics = [t.strip() for t in line.replace("TOPICS:", "").split(",") if t.strip()]
                elif line.startswith("SKILLS:"):
                    skills = [s.strip() for s in line.replace("SKILLS:", "").split(",") if s.strip()]
                elif line.startswith("TOOLS:"):
                    tools = [t.strip() for t in line.replace("TOOLS:", "").split(",") if t.strip()]

            return KeywordExtractionResult(
                syllabus_id=syllabus_id,
                keywords=keywords,
                topics=topics[:5],
                skills=skills[:5],
                tools_technologies=tools[:5]
            )

        except Exception as e:
            logger.error(f"Failed to extract keywords: {e}")
            return KeywordExtractionResult(
                syllabus_id=syllabus_id,
                keywords=[],
                topics=[],
                skills=[],
                tools_technologies=[]
            )


# Singleton
_service: Optional[SummarizerService] = None


def get_summarizer_service() -> SummarizerService:
    global _service
    if _service is None:
        _service = SummarizerService()
    return _service
