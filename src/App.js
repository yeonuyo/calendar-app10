import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import EventList from './components/EventList';
import EventForm from './components/EventForm';
import Chatbot from './components/Chatbot';
import { format, isSameDay, isToday, addDays } from 'date-fns';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('events'); // 'events' 또는 'chatbot'
  const [notification, setNotification] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 로컬 스토리지에서 이벤트 불러오기
  useEffect(() => {
    const savedEvents = localStorage.getItem('events');
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents);
        // 날짜 문자열을 Date 객체로 변환
        const eventsWithDates = parsedEvents.map(event => ({
          ...event,
          date: new Date(event.date)
        }));
        setEvents(eventsWithDates);
      } catch (error) {
        console.error('Failed to parse saved events:', error);
      }
    }
  }, []);

  // 이벤트가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem('events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  }, [events]);

  // 로컬 알림 권한 요청
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  // 마감일 알림 체크
  useEffect(() => {
    const checkDeadlines = () => {
      try {
        const today = new Date();
        const tomorrow = addDays(today, 1);
        
        // 내일 마감인 과제들 찾기
        const tomorrowDeadlines = events.filter(event => {
          if (!event || !event.date || !event.type) return false;
          const eventDate = new Date(event.date);
          return isSameDay(eventDate, tomorrow) && event.type === 'assignment';
        });

        if (tomorrowDeadlines.length > 0) {
          // 현재 날짜와 마감일 포맷팅
          const todayStr = format(today, 'yyyy년 M월 d일');
          const tomorrowStr = format(tomorrow, 'yyyy년 M월 d일');
          
          // 앱 내부 알림 메시지 생성
          const appMessage = tomorrowDeadlines.length === 1
            ? `[${todayStr}] 내일(${tomorrowStr}) 마감 과제가 있습니다:\n${tomorrowDeadlines[0].title}`
            : `[${todayStr}] 내일(${tomorrowStr}) 마감 과제가 총 ${tomorrowDeadlines.length}건 있습니다`;
          
          showNotification(appMessage, 'warning');

          // 브라우저 알림 표시
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              // 과제 목록 생성
              const deadlinesList = tomorrowDeadlines.length === 1 
                ? tomorrowDeadlines[0].title
                : tomorrowDeadlines
                    .map((event, index) => `${index + 1}. ${event.title}`)
                    .join('\n');

              const notificationOptions = {
                body: `현재: ${todayStr}\n마감일: ${tomorrowStr}\n\n${deadlinesList}`,
                icon: '/favicon.ico',
                tag: 'deadline-notification',
                requireInteraction: true
              };

              // 이전 알림이 있다면 닫기
              if (window.currentNotification) {
                window.currentNotification.close();
              }

              // 새 알림 생성 및 저장
              window.currentNotification = new Notification('마감 예정 과제 알림', notificationOptions);
            } catch (error) {
              console.error('브라우저 알림 생성 중 오류:', error);
            }
          }
        }
      } catch (error) {
        console.error('마감일 체크 중 오류:', error);
      }
    };

    // 페이지 로드 시 한 번 체크
    checkDeadlines();

    // 1시간마다 체크 (3600000ms = 1시간)
    const intervalId = setInterval(checkDeadlines, 3600000);

    return () => {
      clearInterval(intervalId);
      // 컴포넌트 언마운트 시 알림 정리
      if (window.currentNotification) {
        window.currentNotification.close();
      }
    };
  }, [events]);

  const getEventTypeName = (type) => {
    switch (type) {
      case 'assignment':
        return '과제';
      case 'exam':
        return '시험';
      case 'lecture':
        return '강의';
      case 'meeting':
        return '미팅';
      case 'academic':
        return '학사일정';
      case 'personal':
        return '개인일정';
      default:
        return '일정';
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const addEvent = (eventData) => {
    const newEvent = {
      ...eventData,
      id: eventData.id || Date.now().toString(),
      date: new Date(eventData.date)
    };

    if (editingEvent) {
      setEvents(events.map(event => 
        event.id === editingEvent.id ? newEvent : event
      ));
      showNotification('일정이 수정되었습니다.');
    } else {
      setEvents([...events, newEvent]);
      showNotification('새로운 일정이 추가되었습니다.');
    }

    // 일정 추가/수정 후 처리
    setShowEventForm(false);
    setEditingEvent(null);
    setSelectedDate(newEvent.date);
    setCurrentMonth(newEvent.date);
    setActiveTab('events');
  };

  const deleteEvent = (eventId) => {
    if (window.confirm('이 일정을 삭제하시겠습니까?')) {
      setEvents(events.filter(event => event.id !== eventId));
      showNotification('일정이 삭제되었습니다.', 'warning');
    }
  };

  const editEvent = (event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>학사일정 및 과제 관리 캘린더</h1>
      </header>
      <div className="notification-container">
        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
      </div>
      <main className="app-main">
        <Calendar 
          events={events} 
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          onAddEvent={() => {
            setEditingEvent(null);
            setShowEventForm(true);
          }}
          setActiveTab={setActiveTab}
        />
        <div className="sidebar">
          <div className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              일정 목록
            </button>
            <button 
              className={`tab-button ${activeTab === 'chatbot' ? 'active' : ''}`}
              onClick={() => setActiveTab('chatbot')}
            >
              챗봇
            </button>
          </div>

          {activeTab === 'events' ? (
            <>
              <EventList 
                events={events.filter(event => {
                  const eventDate = new Date(event.date);
                  return isSameDay(eventDate, selectedDate);
                })}
                onDelete={deleteEvent}
                onEdit={editEvent}
              />
              {showEventForm && (
                <EventForm 
                  selectedDate={selectedDate}
                  onSave={addEvent}
                  onCancel={() => {
                    setShowEventForm(false);
                    setEditingEvent(null);
                  }}
                  event={editingEvent}
                />
              )}
              {!showEventForm && (
                <button 
                  className="add-event-button"
                  onClick={() => {
                    setEditingEvent(null);
                    setShowEventForm(true);
                  }}
                >
                  일정 추가하기
                </button>
              )}
            </>
          ) : (
            <Chatbot onSave={addEvent} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;