import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { activityApi } from '../services/api';
import type { ActivityLog } from '../types';
import './DashboardPage.css';

const DashboardPage = () => {
  const [upcomingActions, setUpcomingActions] = useState<ActivityLog[]>([]);
  const [overdueActions, setOverdueActions] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNextActions();
  }, []);

  const fetchNextActions = async () => {
    setLoading(true);
    try {
      const [upcomingRes, overdueRes] = await Promise.all([
        activityApi.getNextActions({ days: 7 }),
        activityApi.getNextActions({ overdue: true }),
      ]);
      setUpcomingActions(upcomingRes.data.activities);
      setOverdueActions(overdueRes.data.activities);
    } catch (err: any) {
      setError('ネクストアクションの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      visit: '訪問',
      phone: '電話',
      email: 'メール',
      web_meeting: 'Web会議',
      other: 'その他',
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="page-title">ダッシュボード</h1>

      {error && <div className="error-message">{error}</div>}

      {/* 期限超過のネクストアクション */}
      {overdueActions.length > 0 && (
        <section className="dashboard-section">
          <h2 className="section-title warning">
            期限超過のネクストアクション ({overdueActions.length}件)
          </h2>
          <div className="action-list">
            {overdueActions.map((activity) => (
              <div key={activity.id} className="action-card overdue">
                <div className="action-header">
                  <Link to={`/companies/${activity.company_id}`} className="company-link">
                    {activity.company_name}
                  </Link>
                  <span className="action-date">
                    期限: {formatDate(activity.next_action_date!)}
                  </span>
                </div>
                <div className="action-content">
                  <span className="action-type">{getActivityTypeLabel(activity.activity_type)}</span>
                  <p className="action-text">{activity.next_action_content}</p>
                </div>
                <div className="action-footer">
                  <span className="action-user">担当: {activity.user_name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 今後7日以内のネクストアクション */}
      <section className="dashboard-section">
        <h2 className="section-title">
          今後7日以内のネクストアクション ({upcomingActions.length}件)
        </h2>
        {upcomingActions.length === 0 ? (
          <p className="no-data">予定されているネクストアクションはありません</p>
        ) : (
          <div className="action-list">
            {upcomingActions.map((activity) => (
              <div key={activity.id} className="action-card">
                <div className="action-header">
                  <Link to={`/companies/${activity.company_id}`} className="company-link">
                    {activity.company_name}
                  </Link>
                  <span className="action-date">
                    期限: {formatDate(activity.next_action_date!)}
                  </span>
                </div>
                <div className="action-content">
                  <span className="action-type">{getActivityTypeLabel(activity.activity_type)}</span>
                  <p className="action-text">{activity.next_action_content}</p>
                </div>
                <div className="action-footer">
                  <span className="action-user">担当: {activity.user_name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="dashboard-actions">
        <Link to="/companies" className="btn btn-primary">
          顧客一覧へ
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
