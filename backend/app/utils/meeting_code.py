"""Meeting code generation, formatting, and normalization utilities."""

import random
import re


def generate_meeting_code() -> str:
    """Generate a random 10-digit numeric meeting code.

    The first digit is non-zero to guarantee a 10-digit number.
    """
    first_digit = str(random.randint(1, 9))
    rest = "".join([str(random.randint(0, 9)) for _ in range(9)])
    return first_digit + rest


def format_meeting_code(code: str) -> str:
    """Format numeric code for display.

    E.g.:
    - 10 digits: "123 456 7890" or "123 4567 8901"
    - 11 digits: "123 4567 8901"
    """
    cleaned = re.sub(r"\D", "", code)
    if len(cleaned) == 10:
        return f"{cleaned[:3]} {cleaned[3:7]} {cleaned[7:]}"
    elif len(cleaned) == 11:
        return f"{cleaned[:3]} {cleaned[3:7]} {cleaned[7:]}"
    return code


def parse_meeting_code(input_str: str) -> str | None:
    """Extract a 10-11 digit meeting code from a raw string or full URL.

    Accepts:
    - "123 4567 8901" -> "12345678901"
    - "123-4567-8901" -> "12345678901"
    - "1234567890" -> "1234567890"
    - "http://localhost:3000/join/1234567890?pwd=xyz" -> "1234567890"
    - "https://zoom.us/j/1234567890" -> "1234567890"
    """
    if not input_str:
        return None

    # Check if input contains a URL path with a code
    url_match = re.search(r"/(?:join|j|meeting)/([0-9\-\s]{9,13})", input_str)
    if url_match:
        digits = re.sub(r"\D", "", url_match.group(1))
        if 9 <= len(digits) <= 12:
            return digits

    # Otherwise strip all non-digits
    digits = re.sub(r"\D", "", input_str)
    if 9 <= len(digits) <= 12:
        return digits

    return None
