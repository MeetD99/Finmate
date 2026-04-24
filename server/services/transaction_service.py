from controllers.vector_db.transaction_categorizer import categorize_transaction as _categorize_transaction

__all__ = ['categorize_transaction']


def categorize_transaction(description):
    """Wrapper for transaction categorization."""
    return _categorize_transaction(description)