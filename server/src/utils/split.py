import math

def compute_equal_splits(amount: float, participant_ids: list[str], expense_id: str) -> list[dict]:
    """
    Computes equal splits for an expense amount among participants.
    Uses floor division and adds the remainder to the last participant
    to ensure the total matches the exact amount without floating point errors.
    """
    n = len(participant_ids)
    if n == 0:
        return []
        
    per_person = math.floor(amount / n)
    remainder = amount - (per_person * n)
    
    splits = []
    for i, pid in enumerate(participant_ids):
        split_amt = per_person
        if i == n - 1:
            split_amt += remainder
            
        splits.append({
            'expense_id': expense_id,
            'user_id': pid,
            'amount_owed': split_amt,
            'is_settled': False
        })
        
    return splits
