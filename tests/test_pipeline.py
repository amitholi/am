import pytest

from pipeline import EchoApiClient, Pipeline, Report, Splitter, Wrapper, Encoder


def test_splitter_sentences():
    parts = Splitter().split("First one. Second one? Third one!")
    assert parts == ["First one.", "Second one?", "Third one!"]


def test_splitter_semicolons_and_newlines():
    assert Splitter().split("a; b\nc") == ["a", "b", "c"]


def test_splitter_single_part_passthrough():
    assert Splitter().split("just one query") == ["just one query"]


def test_splitter_caps_parts():
    query = " ".join(f"s{i}." for i in range(10))
    parts = Splitter(max_parts=3).split(query)
    assert len(parts) == 3
    assert parts[2].endswith("s9.")  # remainder folded into last part


def test_splitter_rejects_empty():
    with pytest.raises(ValueError):
        Splitter().split("   ")


def test_wrapper_envelope():
    env = Wrapper(source="test").wrap(Encoder().encode("q"), 2, "abc")
    assert env == {"id": "abc-2", "index": 2, "source": "test", "payload": {"query": "q"}}


def test_pipeline_end_to_end():
    report = Pipeline(client=EchoApiClient()).run("Alpha. Beta. Gamma.")
    assert isinstance(report, Report)
    assert [r.sub_query for r in report.results] == ["Alpha.", "Beta.", "Gamma."]
    assert report.succeeded == 3
    assert report.results[1].response["result"] == "echo: Beta."
    assert "3 ok" in report.render()


def test_pipeline_isolates_failures():
    def flaky(q):
        if "bad" in q:
            raise RuntimeError("boom")
        return "ok"

    report = Pipeline(client=EchoApiClient(handler=flaky)).run("good one. bad one. good two.")
    assert report.succeeded == 2
    failed = [r for r in report.results if not r.ok]
    assert len(failed) == 1 and "boom" in failed[0].error
    assert "ERROR: boom" in report.render()
