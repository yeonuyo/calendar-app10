import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import '../styles/EventForm.css';

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

const EventForm = ({ selectedDate, onSave, onCancel, event }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(selectedDate, 'yyyy-MM-dd'));
  const [time, setTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [type, setType] = useState('assignment');
  const [priority, setPriority] = useState('medium');
  const [color, setColor] = useState(EVENT_TYPES[0].defaultColor);
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [tag, setTag] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setDate(format(new Date(event.date), 'yyyy-MM-dd'));
      setTime(event.time || '09:00');
      setEndTime(event.endTime || '10:00');
      setType(event.type || 'assignment');
      setPriority(event.priority || 'medium');
      setColor(event.color || EVENT_TYPES.find(t => t.id === event.type)?.defaultColor || EVENT_TYPES[0].defaultColor);
      setUseCustomColor(event.color !== EVENT_TYPES.find(t => t.id === event.type)?.defaultColor);
      setTag(event.tag || '');
    } else {
      setDate(format(selectedDate, 'yyyy-MM-dd'));
      setType('assignment');
      setPriority('medium');
      setColor(EVENT_TYPES[0].defaultColor);
      setUseCustomColor(false);
    }
  }, [event, selectedDate]);

  useEffect(() => {
    if (!useCustomColor) {
      if (type === 'assignment') {
        // 과제인 경우 난이도에 따른 색상 적용
        setColor(DIFFICULTY_COLORS[priority]);
      } else {
        // 다른 일정 유형인 경우 기본 색상 적용
        const selectedType = EVENT_TYPES.find(t => t.id === type);
        if (selectedType) {
          setColor(selectedType.defaultColor);
        }
      }
    }
  }, [type, priority, useCustomColor]);

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const eventData = {
        id: event ? event.id : Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        date: new Date(`${date}T${time}`),
        time,
        endTime,
        type,
        priority,
        color,
        tag: tag.trim()
      };
      onSave(eventData);
    } catch (error) {
      console.error('일정 저장 중 오류:', error);
      alert('일정 저장 중 오류가 발생했습니다. 입력값을 확인해주세요.');
    }
  };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <h3>{event ? '일정 수정' : '새 일정 추가'}</h3>
      
      <div className="form-group">
        <label htmlFor="title">제목</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="일정 제목을 입력하세요"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="type">유형</label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {EVENT_TYPES.map(type => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="date">날짜</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="time">시작 시간</label>
          <input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="endTime">종료 시간</label>
          <input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="priority">난이도</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="high">어려움</option>
            <option value="medium">보통</option>
            <option value="low">쉬움</option>
          </select>
        </div>

        <div className="form-group color-group">
          <label>
            <input
              type="checkbox"
              checked={useCustomColor}
              onChange={(e) => setUseCustomColor(e.target.checked)}
            />
            색상 직접 지정
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={!useCustomColor}
          />
          {!useCustomColor && type === 'assignment' && (
            <div className="color-preview" style={{ backgroundColor: color }}>
              난이도 기본 색상
            </div>
          )}
          {!useCustomColor && type !== 'assignment' && (
            <div className="color-preview" style={{ backgroundColor: color }}>
              일정 유형 기본 색상
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="tag">태그</label>
        <input
          id="tag"
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="태그 입력 (선택사항)"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="description">설명</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
          placeholder="일정에 대한 설명을 입력하세요"
        />
      </div>
      
      <div className="form-buttons">
        <button type="button" className="cancel-button" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="save-button">
          저장
        </button>
      </div>
    </form>
  );
};

export default EventForm;