from .database import db
from datetime import datetime


class RiskProfile(db.Model):
    __tablename__ = 'risk_profile'

    risk_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    monthly_income = db.Column(db.Integer, nullable=False)
    emi_burden = db.Column(db.Integer, nullable=False)
    dependants = db.Column(db.Integer, nullable=False)
    employment_type = db.Column(db.Integer, nullable=False)
    risk_score = db.Column(db.Integer, nullable=False)
    risk_category = db.Column(db.Integer, nullable=False)
    trim_adjustment = db.Column(db.Float, nullable=True, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'risk_id': self.risk_id,
            'user_id': self.user_id,
            'age': self.age,
            'monthly_income': self.monthly_income,
            'emi_burden': self.emi_burden,
            'dependants': self.dependants,
            'employment_type': self.employment_type,
            'risk_score': self.risk_score,
            'risk_category': self.risk_category,
            'trim_adjustment': self.trim_adjustment,
            'created_at': self.created_at.isoformat()
        }