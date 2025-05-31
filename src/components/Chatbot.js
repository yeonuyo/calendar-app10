import React, { useState } from 'react';
import '../styles/Chatbot.css';

const EVENT_TYPES = [
  { id: 'assignment', label: '과제', defaultColor: '#FF5733' },
  { id: 'exam', label: '시험', defaultColor: '#C70039' },
  { id: 'lecture', label: '강의', defaultColor: '#900C3F' },
  { id: 'meeting', label: '미팅', defaultColor: '#581845' },
  { id: 'academic', label: '학사일정', defaultColor: '#2874A6' },
  { id: 'personal', label: '개인일정', defaultColor: '#229954' }
];

const DIFFICULTY_COLORS = {
  low: '#4CAF50',    // 연한 초록
  medium: '#2196F3', // 파랑
  high: '#F44336'    // 빨강
};

const DIFFICULTY_KEYWORDS = {
  high: ['어려운', '복잡한', '심화', '고난도', '도전적', '심층', '종합', '프로젝트'],
  medium: ['중간', '보통', '일반', '기본'],
  low: ['쉬운', '간단한', '기초', '입문', '단순']
};

const Chatbot = ({ onSave }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [extractedInfo, setExtractedInfo] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // 사용자 메시지 추가
    const newMessages = [...messages, { text: inputMessage, type: 'user' }];
    setMessages(newMessages);

    // 과제 정보 추출 시도
    const extracted = extractAssignmentInfo(inputMessage);
    if (extracted.title !== '알 수 없음' || extracted.deadline !== '알 수 없음') {
      setExtractedInfo(extracted);
    }

    // 봇 응답 추가
    setTimeout(() => {
      setMessages([...newMessages, {
        text: '과제 정보를 분석했습니다. 추출된 정보를 확인해 주세요.',
        type: 'bot'
      }]);
    }, 500);

    setInputMessage('');
  };

  const handleSaveToCalendar = () => {
    if (!extractedInfo) return;

    const deadlineDate = parseDeadlineDate(extractedInfo.deadline);
    if (!deadlineDate) {
      alert('마감일 형식이 올바르지 않습니다.');
      return;
    }

    const eventData = {
      title: extractedInfo.title,
      type: 'assignment',
      date: deadlineDate,
      time: '23:59',
      endTime: '23:59',
      description: `배점: ${extractedInfo.points}\n제출장소: ${extractedInfo.location}`,
      priority: extractedInfo.suggestedDifficulty,
      color: DIFFICULTY_COLORS[extractedInfo.suggestedDifficulty]
    };

    onSave(eventData);
    setMessages([...messages, {
      text: '일정이 캘린더에 저장되었습니다.',
      type: 'bot'
    }]);
    setExtractedInfo(null);
  };

  const handleEditAndSave = () => {
    if (!extractedInfo) return;

    const deadlineDate = parseDeadlineDate(extractedInfo.deadline);
    if (!deadlineDate) {
      alert('마감일 형식이 올바르지 않습니다.');
      return;
    }

    const assignmentType = EVENT_TYPES.find(t => t.id === 'assignment');
    const eventData = {
      title: extractedInfo.title,
      type: 'assignment',
      date: deadlineDate,
      time: '23:59',
      endTime: '23:59',
      description: `배점: ${extractedInfo.points}\n제출장소: ${extractedInfo.location}`,
      priority: 'high',
      color: assignmentType.defaultColor
    };

    onSave(eventData);
    setMessages([...messages, {
      text: '일정이 캘린더에 저장되었습니다.',
      type: 'bot'
    }]);
    setExtractedInfo(null);
  };

  const parseDeadlineDate = (deadlineStr) => {
    if (!deadlineStr || deadlineStr === '알 수 없음') return null;

    // 다양한 날짜 형식 처리
    const patterns = [
      {
        regex: /(\d{4})[-\/년]\s*(\d{1,2})[-\/월]\s*(\d{1,2})일?/,
        handler: (matches) => new Date(matches[1], matches[2] - 1, matches[3])
      },
      {
        regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        handler: (matches) => new Date(matches[3], matches[1] - 1, matches[2])
      },
      {
        regex: /(\d{1,2})월\s*(\d{1,2})일/,
        handler: (matches) => {
          const now = new Date();
          return new Date(now.getFullYear(), matches[1] - 1, matches[2]);
        }
      }
    ];

    for (const { regex, handler } of patterns) {
      const matches = deadlineStr.match(regex);
      if (matches) {
        return handler(matches);
      }
    }

    return null;
  };

  const analyzeDifficulty = (text) => {
    // 점수가 높을수록 어려운 과제
    let difficultyScore = 0;
    
    // 키워드 기반 분석
    const words = text.toLowerCase().split(/[\s,.]+/);
    words.forEach(word => {
      if (DIFFICULTY_KEYWORDS.high.some(keyword => word.includes(keyword))) {
        difficultyScore += 2;
      } else if (DIFFICULTY_KEYWORDS.medium.some(keyword => word.includes(keyword))) {
        difficultyScore += 1;
      } else if (DIFFICULTY_KEYWORDS.low.some(keyword => word.includes(keyword))) {
        difficultyScore -= 1;
      }
    });

    // 배점 기반 분석
    const pointsMatch = text.match(/(\d+)\s*점/);
    if (pointsMatch) {
      const points = parseInt(pointsMatch[1]);
      if (points >= 30) difficultyScore += 2;
      else if (points >= 15) difficultyScore += 1;
    }

    // 최종 난이도 결정
    if (difficultyScore >= 2) return 'high';
    if (difficultyScore >= 0) return 'medium';
    return 'low';
  };

  const extractAssignmentInfo = (text) => {
    const extracted = {
      title: '알 수 없음',
      deadline: '알 수 없음',
      points: '알 수 없음',
      location: '알 수 없음',
      suggestedDifficulty: 'medium' // 기본값
    };

    // 제목 추출
    const titlePatterns = [
      /과제[\s]*[:：]\s*(.+?)(?=\n|마감|제출|배점|점수)/i,
      /제목[\s]*[:：]\s*(.+?)(?=\n|마감|제출|배점|점수)/i,
      /[\[<【](.+?)[\]>】]/,
      /^(.+?)(?=과제|assignment|homework)/i
    ];

    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted.title = match[1].trim();
        break;
      }
    }

    // 마감일 추출
    const deadlinePatterns = [
      /마감일?[\s]*[:：]\s*(\d{4}[-\/년]\s*\d{1,2}[-\/월]\s*\d{1,2}일?)/i,
      /제출일?[\s]*[:：]\s*(\d{4}[-\/년]\s*\d{1,2}[-\/월]\s*\d{1,2}일?)/i,
      /기한[\s]*[:：]\s*(\d{4}[-\/년]\s*\d{1,2}[-\/월]\s*\d{1,2}일?)/i,
      /(\d{4}[-\/년]\s*\d{1,2}[-\/월]\s*\d{1,2}일?)까지/i,
      /(\d{1,2}\/\d{1,2}\/?\d{0,4})/,
      /(\d{1,2}월\s*\d{1,2}일)/
    ];

    for (const pattern of deadlinePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted.deadline = match[1].trim();
        break;
      }
    }

    // 배점 추출
    const pointsPatterns = [
      /배점[\s]*[:：]\s*(\d+)\s*점/i,
      /점수[\s]*[:：]\s*(\d+)\s*점/i,
      /(\d+)\s*점\s*만점/i,
      /(\d+)\s*점/i
    ];

    for (const pattern of pointsPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted.points = match[1] + '점';
        break;
      }
    }

    // 제출 장소 추출
    const locationPatterns = [
      /제출[\s]*[:：]\s*(.+?)(?=\n|$)/i,
      /제출처[\s]*[:：]\s*(.+?)(?=\n|$)/i,
      /제출장소[\s]*[:：]\s*(.+?)(?=\n|$)/i
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted.location = match[1].trim();
        break;
      }
    }

    // 난이도 분석
    extracted.suggestedDifficulty = analyzeDifficulty(text);

    return extracted;
  };

  return (
    <div className="chatbot">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            {message.text}
          </div>
        ))}
      </div>

      {extractedInfo && (
        <div className="extracted-info">
          <h4>추출된 정보</h4>
          <div className="info-grid">
            <div className="info-item">
              <label>과제명:</label>
              <span>{extractedInfo.title}</span>
            </div>
            <div className="info-item">
              <label>마감일:</label>
              <span>{extractedInfo.deadline}</span>
            </div>
            <div className="info-item">
              <label>배점:</label>
              <span>{extractedInfo.points}</span>
            </div>
            <div className="info-item">
              <label>제출장소:</label>
              <span>{extractedInfo.location}</span>
            </div>
            <div className="info-item">
              <label>추천 난이도:</label>
              <span style={{ color: DIFFICULTY_COLORS[extractedInfo.suggestedDifficulty] }}>
                {extractedInfo.suggestedDifficulty === 'high' ? '어려움' :
                 extractedInfo.suggestedDifficulty === 'medium' ? '보통' : '쉬움'}
              </span>
            </div>
          </div>
          <p className="difficulty-notice">
            ※ 난이도는 자동 추천된 것이며, 일정 등록 시 수정할 수 있습니다.
          </p>
          <div className="extracted-actions">
            <button 
              className="save-extracted-button"
              onClick={handleSaveToCalendar}
            >
              캘린더에 저장
            </button>
            <button 
              className="edit-extracted-button"
              onClick={handleEditAndSave}
            >
              수정 후 저장
            </button>
          </div>
        </div>
      )}

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="과제 정보를 입력하세요..."
        />
        <button type="submit">전송</button>
      </form>
    </div>
  );
};

export default Chatbot; 