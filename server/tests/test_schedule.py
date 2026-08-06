import unittest
from datetime import datetime

from src.utils.schedule import (
    InvalidSchedule,
    activity_interval,
    conflicting_activities,
    intervals_overlap,
    nearest_available_slots,
    shifted_interval,
    within_trip,
)


def activity(identifier, start_date, start_time, end_date, end_time, title=None):
    return {
        "id": identifier,
        "title": title or identifier,
        "activity_date": start_date,
        "start_time": start_time,
        "end_date": end_date,
        "end_time": end_time,
    }


class ScheduleTests(unittest.TestCase):
    def test_half_open_overlap_allows_adjacent_activities(self):
        first = (datetime(2026, 8, 20, 9), datetime(2026, 8, 20, 10))
        adjacent = (datetime(2026, 8, 20, 10), datetime(2026, 8, 20, 11))
        partial = (datetime(2026, 8, 20, 9, 30), datetime(2026, 8, 20, 10, 30))
        containing = (datetime(2026, 8, 20, 8), datetime(2026, 8, 20, 12))
        self.assertFalse(intervals_overlap(first, adjacent))
        self.assertTrue(intervals_overlap(first, partial))
        self.assertTrue(intervals_overlap(first, containing))

    def test_invalid_or_zero_duration_is_rejected(self):
        with self.assertRaises(InvalidSchedule):
            activity_interval(activity("zero", "2026-08-20", "11:44", "2026-08-20", "11:44"))
        with self.assertRaises(InvalidSchedule):
            activity_interval(activity("missing", "2026-08-20", None, "2026-08-20", "12:00"))

    def test_conflicts_include_multi_day_and_exclude_current_activity(self):
        rows = [
            activity("self", "2026-08-20", "09:00", "2026-08-20", "10:00"),
            activity("multi", "2026-08-21", "11:45", "2026-08-27", "11:45"),
        ]
        candidate = (datetime(2026, 8, 24, 9), datetime(2026, 8, 24, 10))
        conflicts = conflicting_activities(candidate, rows, excluding_id="self")
        self.assertEqual([item["id"] for item in conflicts], ["multi"])

    def test_dragging_middle_occurrence_shifts_entire_activity(self):
        row = activity("multi", "2026-08-21", "11:45", "2026-08-27", "11:45")
        moved = shifted_interval(row, "2026-08-24", "2026-08-29")
        self.assertEqual(moved[0], datetime(2026, 8, 26, 11, 45))
        self.assertEqual(moved[1], datetime(2026, 9, 1, 11, 45))

    def test_override_preserves_duration(self):
        row = activity("one", "2026-08-20", "09:00", "2026-08-20", "10:30")
        moved = shifted_interval(row, "2026-08-20", "2026-08-22", "14:15")
        self.assertEqual(moved[0], datetime(2026, 8, 22, 14, 15))
        self.assertEqual(moved[1], datetime(2026, 8, 22, 15, 45))

    def test_suggestions_are_nearest_15_minute_free_slots(self):
        trip = {"start_date": "2026-08-20", "end_date": "2026-08-22"}
        blocker = activity("busy", "2026-08-21", "10:00", "2026-08-21", "11:00")
        candidate = (datetime(2026, 8, 21, 10), datetime(2026, 8, 21, 10, 30))
        suggestions = nearest_available_slots(candidate, [blocker], trip)
        self.assertEqual(suggestions[0]["start_time"], "09:30:00")
        self.assertTrue(all(item["start_time"].endswith(":00") for item in suggestions))

    def test_trip_boundaries_include_the_last_day(self):
        trip = {"start_date": "2026-08-20", "end_date": "2026-08-22"}
        self.assertTrue(within_trip((datetime(2026, 8, 22, 22), datetime(2026, 8, 22, 23)), trip))
        self.assertFalse(within_trip((datetime(2026, 8, 22, 23), datetime(2026, 8, 23, 1)), trip))


if __name__ == "__main__":
    unittest.main()
