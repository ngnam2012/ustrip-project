from datetime import date, datetime, time, timedelta
from typing import Any, Dict, Iterable, List, Optional, Tuple


class InvalidSchedule(ValueError):
    pass


def _date(value: Any) -> Optional[date]:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value)[:10])


def _time(value: Any) -> Optional[time]:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.time().replace(tzinfo=None)
    if isinstance(value, time):
        return value.replace(tzinfo=None)
    return time.fromisoformat(str(value))


def activity_interval(activity: Dict[str, Any]) -> Tuple[datetime, datetime]:
    start_date = _date(activity.get("activity_date"))
    end_date = _date(activity.get("end_date")) or start_date
    start_time = _time(activity.get("start_time"))
    end_time = _time(activity.get("end_time"))
    if not start_date or not end_date or not start_time or not end_time:
        raise InvalidSchedule("Hoạt động phải có đầy đủ ngày và giờ bắt đầu/kết thúc")

    start = datetime.combine(start_date, start_time)
    end = datetime.combine(end_date, end_time)
    if end <= start:
        raise InvalidSchedule("Giờ kết thúc phải sau giờ bắt đầu")
    return start, end


def intervals_overlap(left: Tuple[datetime, datetime], right: Tuple[datetime, datetime]) -> bool:
    return left[0] < right[1] and left[1] > right[0]


def conflicting_activities(
    candidate: Tuple[datetime, datetime],
    activities: Iterable[Dict[str, Any]],
    excluding_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    conflicts = []
    for activity in activities:
        if excluding_id and activity.get("id") == excluding_id:
            continue
        try:
            other = activity_interval(activity)
        except (InvalidSchedule, ValueError):
            # Existing incomplete legacy rows cannot occupy a reliable interval.
            continue
        if intervals_overlap(candidate, other):
            conflicts.append(activity)
    return conflicts


def shifted_interval(
    activity: Dict[str, Any],
    source_occurrence_date: Any,
    target_occurrence_date: Any,
    start_time_override: Any = None,
) -> Tuple[datetime, datetime]:
    original_start, original_end = activity_interval(activity)
    source = _date(source_occurrence_date)
    target = _date(target_occurrence_date)
    if not source or not target:
        raise InvalidSchedule("Ngày nguồn và ngày đích là bắt buộc")

    delta = target - source
    candidate_start = original_start + delta
    duration = original_end - original_start
    override = _time(start_time_override)
    if override:
        candidate_start = datetime.combine(candidate_start.date(), override)
    return candidate_start, candidate_start + duration


def within_trip(candidate: Tuple[datetime, datetime], trip: Dict[str, Any]) -> bool:
    trip_start = _date(trip.get("start_date"))
    trip_end = _date(trip.get("end_date"))
    if not trip_start or not trip_end:
        return False
    lower = datetime.combine(trip_start, time.min)
    upper = datetime.combine(trip_end + timedelta(days=1), time.min)
    return candidate[0] >= lower and candidate[1] <= upper


def interval_payload(candidate: Tuple[datetime, datetime]) -> Dict[str, str]:
    return {
        "activity_date": candidate[0].date().isoformat(),
        "end_date": candidate[1].date().isoformat(),
        "start_time": candidate[0].time().replace(microsecond=0).isoformat(),
        "end_time": candidate[1].time().replace(microsecond=0).isoformat(),
    }


def public_conflict(activity: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": activity.get("id"),
        "title": activity.get("title"),
        "activity_date": str(activity.get("activity_date")) if activity.get("activity_date") else None,
        "end_date": str(activity.get("end_date")) if activity.get("end_date") else None,
        "start_time": str(activity.get("start_time")) if activity.get("start_time") else None,
        "end_time": str(activity.get("end_time")) if activity.get("end_time") else None,
    }


def nearest_available_slots(
    candidate: Tuple[datetime, datetime],
    activities: Iterable[Dict[str, Any]],
    trip: Dict[str, Any],
    excluding_id: Optional[str] = None,
    limit: int = 3,
) -> List[Dict[str, str]]:
    duration = candidate[1] - candidate[0]
    target_date = candidate[0].date()
    slots = []
    cursor = datetime.combine(target_date, time.min)
    end_of_day = datetime.combine(target_date, time(23, 45))
    while cursor <= end_of_day:
        proposed = (cursor, cursor + duration)
        if (
            proposed != candidate
            and within_trip(proposed, trip)
            and not conflicting_activities(proposed, activities, excluding_id)
        ):
            distance = abs((cursor - candidate[0]).total_seconds())
            # Prefer a later slot when two suggestions are equally close.
            direction_rank = 0 if cursor >= candidate[0] else 1
            slots.append((distance, direction_rank, cursor, proposed))
        cursor += timedelta(minutes=15)

    slots.sort(key=lambda item: (item[0], item[1], item[2]))
    return [interval_payload(item[3]) for item in slots[:limit]]
