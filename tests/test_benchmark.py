import json

from benchmark import QUERIES, main, render_html, run


def test_dry_run_all_queries():
    suite = run(QUERIES, live=False)
    assert len(suite.cases) == len(QUERIES)
    assert suite.mean_coverage == 1.0  # echo client answers every sub-query
    assert suite.total_seconds >= 0


def test_quick_is_single_query(capsys):
    assert main(["--quick"]) == 0
    out = capsys.readouterr().out
    assert "queries: 1" in out


def test_json_output(tmp_path):
    path = tmp_path / "report.json"
    assert main(["--quick", "--json", str(path)]) == 0
    data = json.loads(path.read_text())
    assert data["queries"] == 1
    assert data["mode"].startswith("dry-run")
    assert "cases" in data and len(data["cases"]) == 1


def test_html_output_is_escaped():
    suite = run(["<script>alert(1)</script>. second part."], live=False)
    page = render_html(suite)
    assert "<script>alert(1)</script>" not in page
    assert "&lt;script&gt;" in page


def test_live_flag_without_creds_falls_back(capsys, monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_AUTH_TOKEN", raising=False)
    monkeypatch.delenv("ANTHROPIC_PROFILE", raising=False)
    assert main(["--quick", "--live"]) == 0
    err = capsys.readouterr().err
    assert "no credentials" in err
