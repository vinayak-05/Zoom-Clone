"""Unit tests for meeting code utilities."""

from app.utils.meeting_code import generate_meeting_code, format_meeting_code, parse_meeting_code


def test_generate_meeting_code():
    code = generate_meeting_code()
    assert len(code) == 10
    assert code.isdigit()
    assert not code.startswith("0")


def test_format_meeting_code():
    formatted_10 = format_meeting_code("1234567890")
    assert formatted_10 == "123 4567 890" or len(formatted_10.split()) == 3

    formatted_11 = format_meeting_code("12345678901")
    assert len(formatted_11.split()) == 3


def test_parse_meeting_code_raw():
    assert parse_meeting_code("1234567890") == "1234567890"
    assert parse_meeting_code("123 456 7890") == "1234567890"
    assert parse_meeting_code("123-456-7890") == "1234567890"


def test_parse_meeting_code_urls():
    assert parse_meeting_code("http://localhost:3000/join/1234567890") == "1234567890"
    assert parse_meeting_code("https://zoom.us/join/9876543210?pwd=abc") == "9876543210"
    assert parse_meeting_code("http://localhost:3000/meeting/5551234567") == "5551234567"


def test_parse_meeting_code_invalid():
    assert parse_meeting_code("123") is None
    assert parse_meeting_code("invalid_text") is None
    assert parse_meeting_code("") is None
