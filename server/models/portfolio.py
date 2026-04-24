from .database import db
from datetime import datetime


class Portfolio(db.Model):
    __tablename__ = 'portfolio'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category = db.Column(db.String(255), nullable=False)
    surplus = db.Column(db.Integer, nullable=False)
    luxury = db.Column(db.Integer, nullable=False)
    total = db.Column(db.Integer, nullable=False)
    non_mandatory = db.Column(db.Integer, nullable=False)
    high = db.Column(db.Integer, nullable=False)
    mid = db.Column(db.Integer, nullable=False)
    low = db.Column(db.Integer, nullable=False)
    l_trim = db.Column(db.Integer, nullable=False)
    n_trim = db.Column(db.Integer, nullable=False)
    luxury_pct = db.Column(db.Float, nullable=True)
    nonmand_pct = db.Column(db.Float, nullable=True)
    chosen_assets = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category': self.category,
            'surplus': self.surplus,
            'luxury': self.luxury,
            'total': self.total,
            'non_mandatory': self.non_mandatory,
            'high': self.high,
            'mid': self.mid,
            'low': self.low,
            'l_trim': self.l_trim,
            'n_trim': self.n_trim,
            'luxury_pct': self.luxury_pct,
            'nonmand_pct': self.nonmand_pct,
            'chosen_assets': self.chosen_assets,
            'created_at': self.created_at.isoformat()
        }