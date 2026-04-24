from .database import db
from .enums import TransactionType, TransactionCategory
from datetime import datetime


class Transaction(db.Model):
    __tablename__ = 'transaction'

    transaction_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    desc = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    type = db.Column(db.Enum(TransactionType), nullable=False)
    date = db.Column(db.Date, nullable=False)
    category = db.Column(db.Enum(TransactionCategory), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'transaction_id': self.transaction_id,
            'user_id': self.user_id,
            'desc': self.desc,
            'amount': self.amount,
            'type': self.type.value,
            'date': self.date.isoformat(),
            'category': self.category.value,
            'created_at': self.created_at.isoformat()
        }