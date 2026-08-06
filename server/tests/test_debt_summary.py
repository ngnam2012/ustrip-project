import unittest

from src.utils.debt_summary import build_debt_dashboard


ME = "me"
AN = "an"
BINH = "binh"


class DebtDashboardTests(unittest.TestCase):
    def setUp(self):
        self.memberships = [
            {"trip_id": "trip-a", "role": "member", "trip": {"id": "trip-a", "name": "A"}},
            {"trip_id": "trip-b", "role": "owner", "trip": {"id": "trip-b", "name": "B"}},
        ]
        self.profiles = {
            AN: {"id": AN, "full_name": "An", "avatar_url": None},
            BINH: {"id": BINH, "full_name": "Bình", "avatar_url": None},
        }

    def test_fund_balance_uses_successful_current_user_contributions(self):
        result = build_debt_dashboard(
            ME,
            self.memberships,
            [
                {"trip_id": "trip-a", "user_id": ME, "amount": 100},
                {"trip_id": "trip-b", "user_id": ME, "amount": 300},
                {"trip_id": "trip-a", "user_id": AN, "amount": 999},
            ],
            [
                {"trip_id": "trip-a", "payment_source": "shared_fund", "splits": [{"user_id": ME, "amount_owed": 150}]},
                {"trip_id": "trip-b", "payment_source": "shared_fund", "splits": [{"user_id": ME, "amount_owed": 200}]},
            ],
            self.profiles,
        )

        self.assertEqual(result["summary"]["fund_i_owe"], 50)
        self.assertEqual(result["summary"]["fund_owed_to_me"], 100)

    def test_personal_debts_ignore_self_and_settled_splits(self):
        result = build_debt_dashboard(
            ME,
            self.memberships,
            [],
            [
                {
                    "trip_id": "trip-a", "payment_source": "personal", "paid_by": AN,
                    "splits": [
                        {"user_id": ME, "amount_owed": 120, "is_settled": False},
                        {"user_id": AN, "amount_owed": 120, "is_settled": False},
                        {"user_id": ME, "amount_owed": 80, "is_settled": True},
                    ],
                },
                {
                    "trip_id": "trip-b", "payment_source": "personal", "paid_by": ME,
                    "splits": [{"user_id": AN, "amount_owed": 70, "is_settled": False}],
                },
                {
                    "trip_id": "trip-b", "payment_source": "personal", "paid_by": ME,
                    "splits": [{"user_id": BINH, "amount_owed": 30, "is_settled": False}],
                },
            ],
            self.profiles,
        )

        self.assertEqual(result["summary"]["personal_i_owe"], 120)
        self.assertEqual(result["summary"]["personal_owed_to_me"], 100)
        an_net = next(row for row in result["counterparty_net"] if row["profile"]["id"] == AN)
        self.assertEqual(an_net["direction"], "i_owe")
        self.assertEqual(an_net["amount"], 50)
        self.assertEqual(len(result["personal_by_trip"]), 3)

    def test_empty_dashboard_has_zero_totals(self):
        result = build_debt_dashboard(ME, [], [], [], {})
        self.assertEqual(result["summary"]["personal_net"], 0)
        self.assertEqual(result["fund_by_trip"], [])
        self.assertEqual(result["counterparty_net"], [])


if __name__ == "__main__":
    unittest.main()
