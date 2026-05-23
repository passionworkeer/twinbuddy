from __future__ import annotations

import json
import logging
import os
import threading
from pathlib import Path

import pytest

import api._store as store_module


@pytest.fixture
def temp_store_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(store_module, "_DATA_DIR", tmp_path)
    return tmp_path


def test_load_store_returns_empty_and_logs_for_corrupt_json(tmp_path, caplog):
    corrupt_file = tmp_path / "corrupt.json"
    corrupt_file.write_text("{not-json}", encoding="utf-8")

    with caplog.at_level(logging.WARNING):
        result = store_module._load_store(corrupt_file)

    assert result == {}
    assert any("Failed to load store" in message for message in caplog.messages)


def test_write_store_atomic_persists_valid_json(temp_store_dir):
    target = temp_store_dir / "profile_store.json"
    payload = {"user-1": {"mbti": "ENFP"}}

    store_module._write_store(target, payload)

    assert json.loads(target.read_text(encoding="utf-8")) == payload
    temp_files = list(temp_store_dir.glob("*.tmp"))
    assert temp_files == []


def test_save_profile_persists_to_profile_store(temp_store_dir, monkeypatch):
    target = temp_store_dir / "profile_store.json"
    monkeypatch.setattr(store_module, "_PROFILE_STORE_FILE", target)
    monkeypatch.setattr(store_module, "_profile_store", {})

    store_module.save_profile("user-1", {"mbti": "INTJ", "city": "深圳"})

    stored = json.loads(target.read_text(encoding="utf-8"))
    assert stored["user-1"]["mbti"] == "INTJ"
    assert store_module.get_profile("user-1")["city"] == "深圳"


def test_concurrent_saves_do_not_corrupt_json(temp_store_dir, monkeypatch):
    target = temp_store_dir / "profile_store.json"
    monkeypatch.setattr(store_module, "_PROFILE_STORE_FILE", target)
    monkeypatch.setattr(store_module, "_profile_store", {})

    def worker(index: int):
        store_module.save_profile(f"user-{index}", {"value": index})

    threads = [threading.Thread(target=worker, args=(index,)) for index in range(5)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    loaded = json.loads(target.read_text(encoding="utf-8"))
    assert set(loaded.keys()) == {f"user-{index}" for index in range(5)}
    for index in range(5):
        assert loaded[f"user-{index}"]["value"] == index
