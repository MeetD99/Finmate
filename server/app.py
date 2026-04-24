from flask import Flask, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

from models.database import db
from models import User, RiskProfile, Transaction, Summary, Portfolio, Expense, ChatHistory

from routes.auth import auth_bp
from routes.risk import risk_bp
from routes.transactions import transactions_bp
from routes.summary import summary_bp
from routes.portfolio import portfolio_bp
from routes.portfolio_v2 import portfolio_bp as portfolio_v2_bp
from routes.upload import upload_bp
from routes.insights import insights_bp
from routes.expenses import expenses_bp
from routes.chat import chat_bp
from routes.assets import assets_bp

app = Flask(__name__)

config_name = os.environ.get('FLASK_ENV', 'development')
from config import config
app.config.from_object(config[config_name])

db.init_app(app)
CORS(app, supports_credentials=True, origins=app.config['CORS_ORIGINS'])

app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False

app.register_blueprint(auth_bp)
app.register_blueprint(risk_bp)
app.register_blueprint(transactions_bp)
app.register_blueprint(summary_bp)
app.register_blueprint(portfolio_bp)
app.register_blueprint(portfolio_v2_bp)
app.register_blueprint(insights_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(expenses_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(assets_bp)


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Finmate API is running'}), 200


@app.errorhandler(404)
def not_found(error):
    return jsonify({'detail': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'detail': 'Internal server error'}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=8080)