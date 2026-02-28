from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)

# 存储排行榜数据的文件
RANKINGS_FILE = 'rankings.json'

def load_rankings():
    """从文件加载排行榜数据"""
    if os.path.exists(RANKINGS_FILE):
        with open(RANKINGS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        return []

def save_rankings(rankings):
    """保存排行榜数据到文件"""
    with open(RANKINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(rankings, f, ensure_ascii=False, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/rankings', methods=['GET'])
def get_rankings():
    """获取排行榜数据"""
    rankings = load_rankings()
    return jsonify(rankings)

@app.route('/api/rankings', methods=['POST'])
def add_score():
    """添加新的分数到排行榜"""
    data = request.get_json()
    name = data.get('name', 'Anonymous')
    score = data.get('score', 0)
    
    if not isinstance(score, int) or score < 0:
        return jsonify({'error': 'Invalid score'}), 400
    
    # 获取当前排行榜
    rankings = load_rankings()
    
    # 添加新分数
    new_entry = {
        'name': name[:20],  # 限制名字长度
        'score': score,
        'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    rankings.append(new_entry)
    
    # 按分数降序排序，并保留前10名
    rankings.sort(key=lambda x: x['score'], reverse=True)
    rankings = rankings[:10]
    
    # 保存更新后的排行榜
    save_rankings(rankings)
    
    return jsonify(rankings)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)