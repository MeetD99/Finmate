from enum import Enum


class TransactionType(Enum):
    WITHDRAW = "Withdraw"
    DEPOSIT = "Deposit"


class TransactionCategory(Enum):
    MANDATORY_UTILITIES = "Mandatory/Utilities"
    NON_MANDATORY = "Non-Mandatory"
    LUXURY_DISCRETIONARY = "Luxury/Discretionary"
    TRAVEL = "Travel"
    INVESTMENT_SAVINGS = "Investment/Savings"
    ADJUSTMENT = "Adjustment"