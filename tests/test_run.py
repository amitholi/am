from obfuscate import obfuscate
from run import main


def test_decompose(capsys):
    assert main(["run.py", "decompose", "One. Two. Three.", "2"]) == 0
    out = capsys.readouterr().out
    assert out.count("[") == 2  # capped at 2 parts


def test_eval_reports_coverage(capsys):
    assert main(["run.py", "eval", "Alpha. Beta."]) == 0
    assert "coverage: 2/2" in capsys.readouterr().out


def test_obfuscate_redacts_pii():
    result = obfuscate("mail me at a@b.com or call +1 415 555 1234 please")
    assert "[EMAIL]" in result.text and "[PHONE]" in result.text
    assert result.counts == {"EMAIL": 1, "PHONE": 1}


def test_obfuscate_normalizes_whitespace():
    assert obfuscate("  a   b\n\nc  ").text == "a b c"


def test_unknown_command_errors():
    assert main(["run.py", "nope"]) == 2


def test_missing_args_errors():
    assert main(["run.py", "decompose"]) == 2
