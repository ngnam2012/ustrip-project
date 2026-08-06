from collections import defaultdict
from decimal import Decimal
from typing import Any, Dict, Iterable, List


ZERO = Decimal("0")


def _money(value: Any) -> Decimal:
    return Decimal(str(value or 0))


def _number(value: Decimal) -> float:
    return float(value.quantize(Decimal("0.01")))


def build_debt_dashboard(
    current_user_id: str,
    memberships: Iterable[Dict[str, Any]],
    contributions: Iterable[Dict[str, Any]],
    expenses: Iterable[Dict[str, Any]],
    profiles: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    """Build a current-user debt dashboard from accepted trip data."""
    trips = {}
    for membership in memberships:
        trip = membership.get("trip") or {}
        trip_id = membership.get("trip_id") or trip.get("id")
        if not trip_id:
            continue
        trips[trip_id] = {
            "id": trip_id,
            "name": trip.get("name") or "Chuyến đi",
            "destination": trip.get("destination"),
            "role": membership.get("role") or "member",
        }

    contributed = defaultdict(lambda: ZERO)
    for contribution in contributions:
        if contribution.get("user_id") == current_user_id:
            contributed[contribution.get("trip_id")] += _money(contribution.get("amount"))

    consumed = defaultdict(lambda: ZERO)
    personal_entries = defaultdict(lambda: ZERO)

    for expense in expenses:
        trip_id = expense.get("trip_id")
        if trip_id not in trips:
            continue
        payer_id = expense.get("paid_by")
        source = expense.get("payment_source")

        for split in expense.get("splits") or []:
            split_user_id = split.get("user_id")
            amount = _money(split.get("amount_owed"))

            if source == "shared_fund" and split_user_id == current_user_id:
                consumed[trip_id] += amount
                continue

            if source != "personal" or split.get("is_settled") or split_user_id == payer_id:
                continue

            if split_user_id == current_user_id and payer_id:
                personal_entries[(trip_id, payer_id, "i_owe")] += amount
            elif payer_id == current_user_id and split_user_id:
                personal_entries[(trip_id, split_user_id, "owed_to_me")] += amount

    fund_by_trip: List[Dict[str, Any]] = []
    fund_i_owe = ZERO
    fund_owed_to_me = ZERO
    for trip_id, trip in trips.items():
        trip_contributed = contributed[trip_id]
        trip_consumed = consumed[trip_id]
        balance = trip_contributed - trip_consumed
        if balance < ZERO:
            direction, amount = "i_owe", -balance
            fund_i_owe += amount
        elif balance > ZERO:
            direction, amount = "owed_to_me", balance
            fund_owed_to_me += amount
        else:
            direction, amount = "settled", ZERO

        fund_by_trip.append({
            "trip": trip,
            "contributed": _number(trip_contributed),
            "consumed": _number(trip_consumed),
            "balance": _number(balance),
            "direction": direction,
            "amount": _number(amount),
        })

    personal_by_trip = []
    personal_i_owe = ZERO
    personal_owed_to_me = ZERO
    counterparty_balances = defaultdict(lambda: ZERO)
    for (trip_id, counterparty_id, direction), amount in personal_entries.items():
        if direction == "i_owe":
            personal_i_owe += amount
            counterparty_balances[counterparty_id] -= amount
        else:
            personal_owed_to_me += amount
            counterparty_balances[counterparty_id] += amount

        personal_by_trip.append({
            "trip": trips[trip_id],
            "counterparty": profiles.get(counterparty_id) or {
                "id": counterparty_id,
                "full_name": "Thành viên",
                "avatar_url": None,
            },
            "direction": direction,
            "amount": _number(amount),
        })

    counterparty_net = []
    for counterparty_id, balance in counterparty_balances.items():
        if balance < ZERO:
            direction, amount = "i_owe", -balance
        elif balance > ZERO:
            direction, amount = "owed_to_me", balance
        else:
            direction, amount = "settled", ZERO
        counterparty_net.append({
            "profile": profiles.get(counterparty_id) or {
                "id": counterparty_id,
                "full_name": "Thành viên",
                "avatar_url": None,
            },
            "balance": _number(balance),
            "direction": direction,
            "amount": _number(amount),
        })

    fund_by_trip.sort(key=lambda item: (-item["amount"], item["trip"]["name"]))
    personal_by_trip.sort(key=lambda item: (-item["amount"], item["trip"]["name"]))
    counterparty_net.sort(key=lambda item: (-item["amount"], item["profile"]["full_name"]))

    return {
        "summary": {
            "fund_i_owe": _number(fund_i_owe),
            "fund_owed_to_me": _number(fund_owed_to_me),
            "personal_i_owe": _number(personal_i_owe),
            "personal_owed_to_me": _number(personal_owed_to_me),
            "personal_net": _number(personal_owed_to_me - personal_i_owe),
        },
        "fund_by_trip": fund_by_trip,
        "personal_by_trip": personal_by_trip,
        "counterparty_net": counterparty_net,
    }
