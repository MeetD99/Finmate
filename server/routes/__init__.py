from .auth import auth_bp
from .risk import risk_bp
from .transactions import transactions_bp
from .summary import summary_bp
from .portfolio import portfolio_bp
from .insights import insights_bp
from .upload import upload_bp

__all__ = [
    'auth_bp',
    'risk_bp',
    'transactions_bp',
    'summary_bp',
    'portfolio_bp',
    'insights_bp',
    'upload_bp'
]