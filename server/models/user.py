from .database import db
from datetime import datetime


class User(db.Model):
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    oauth_provider = db.Column(db.String(20), nullable=True)
    oauth_provider_id = db.Column(db.String(100), nullable=True)
    refresh_token = db.Column(db.Text, nullable=True)

    risk_profiles = db.relationship('RiskProfile', backref='user', lazy=True, cascade='all, delete-orphan')
    transactions = db.relationship('Transaction', backref='user', lazy=True, cascade='all, delete-orphan')
    summaries = db.relationship('Summary', backref='user', lazy=True, cascade='all, delete-orphan')
    portfolios = db.relationship('Portfolio', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_risk_profile_status=False):
        user_dict = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

        if include_risk_profile_status:
            from .risk_profile import RiskProfile
            has_risk_profile = RiskProfile.query.filter_by(user_id=self.id).first() is not None
            user_dict['has_risk_profile'] = has_risk_profile

        return user_dict