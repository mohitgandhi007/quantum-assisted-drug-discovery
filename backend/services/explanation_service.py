import os
import json
import re
import logging
from typing import Dict, Any

try:
    # Try importing google-genai, but fallback if not installed
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

logger = logging.getLogger(__name__)

class ExplanationService:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key and HAS_GENAI:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    def generate_explanation(self, candidate_data: Dict[str, Any]) -> str:
        """
        Generates a scientific explanation for a candidate using an LLM.
        Falls back to a structured template if the LLM is unavailable or fails.
        """
        if not self.client:
            return self._generate_fallback(candidate_data)
            
        system_instruction = (
            "You are a scientific explanation agent for an AI-Quantum drug discovery pipeline targeting EGFR. "
            "Your task is to explain why a given molecular candidate was computationally prioritized. "
            "CRITICAL SCIENTIFIC SAFETY RULES:\n"
            "- NEVER claim that the molecule 'cures cancer', 'is a guaranteed drug', or 'will work in humans'.\n"
            "- ALWAYS use cautious language such as 'computationally prioritized', 'predicted', 'docking-based evidence', and 'requires experimental validation'.\n"
            "- You MUST NOT invent, hallucinate, or fabricate ANY numerical values. All numbers in your response MUST come exactly from the provided JSON data.\n"
            "- Explain the molecular properties, binding evidence, classical ranking, quantum selection, and explicitly state the limitations.\n"
            "Keep the response concise, professional, and structured."
        )
        
        prompt = f"Explain the following computationally prioritized candidate:\n\n{json.dumps(candidate_data, indent=2)}"
        
        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.0
                )
            )
            
            # Simple hallucination check: extract numbers from output and ensure they exist in the input
            output = response.text
            if not self._verify_numbers(output, candidate_data):
                logger.warning("LLM output contained unverified numbers. Using fallback.")
                return self._generate_fallback(candidate_data)
                
            return output
            
        except Exception as e:
            logger.error(f"LLM generation failed: {e}. Using fallback.")
            return self._generate_fallback(candidate_data)

    def _generate_fallback(self, c: Dict[str, Any]) -> str:
        """Fallback explanation if the LLM is unavailable."""
        props = c.get("properties", {})
        bind = c.get("binding_evidence", {}) or {}
        
        q_status = "was prioritized" if c.get("quantum_selection_status") else "was not prioritized"
        
        explanation = (
            f"Candidate {c.get('candidate_id')} was computationally evaluated and {q_status} by the quantum algorithm. "
            f"It possesses a QED score of {props.get('qed', 'N/A')} and ESOL of {props.get('esol', 'N/A')}, yielding a classical score of {c.get('classical_score', 'N/A')}. "
        )
        
        if bind.get("method"):
            explanation += f"Docking-based evidence ({bind.get('method')}) yielded a predicted score of {bind.get('score', 'N/A')} ({bind.get('score_direction', '')}). "
            
        explanation += (
            "These findings represent purely computational hypotheses and require experimental validation. "
            "This molecule is predicted to bind EGFR but is not an approved drug and has not been tested in humans."
        )
        
        return explanation
        
    def _verify_numbers(self, text: str, data: Dict[str, Any]) -> bool:
        """
        Ensures every number present in the generated text (e.g. 0.75, 42)
        is actually present somewhere in the JSON data values.
        """
        def get_all_numbers(d, acc):
            if isinstance(d, dict):
                for v in d.values():
                    get_all_numbers(v, acc)
            elif isinstance(d, list):
                for v in d:
                    get_all_numbers(v, acc)
            elif isinstance(d, (int, float)) and not isinstance(d, bool):
                acc.add(str(d))
        
        allowed_numbers = set()
        get_all_numbers(data, allowed_numbers)
        
        numbers = re.findall(r'-?\b\d+\.\d+\b|-?\b\d+\b', text)
        
        for num in numbers:
            # We ignore very small integers like 0, 1, 2 which might just be standard English grammar or ordinals.
            if num in ["0", "1", "2", "3", "4", "5"]:
                continue
            
            # Format comparison safely
            if num not in allowed_numbers:
                # sometimes 0.5 might be 0.50 in text, we check float equivalence
                try:
                    num_val = float(num)
                    if not any(abs(float(a) - num_val) < 1e-5 for a in allowed_numbers):
                        return False
                except ValueError:
                    return False
        return True

explanation_service = ExplanationService()
