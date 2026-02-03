import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { companyApi, activityApi } from '../services/api';
import type { Company, Contact, CompanyAssignment, ActivityLog } from '../types';
import './CompanyDetailPage.css';

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [assignments, setAssignments] = useState<CompanyAssignment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activityDate: new Date().toISOString().split('T')[0],
    activityType: 'phone' as const,
    content: '',
    nextActionDate: '',
    nextActionContent: '',
  });

  useEffect(() => {
    if (id) {
      fetchCompanyDetails();
      fetchActivities();
    }
  }, [id]);

  const fetchCompanyDetails = async () => {
    try {
      const response = await companyApi.getCompany(Number(id));
      setCompany(response.data.company);
      setContacts(response.data.contacts);
      setAssignments(response.data.assignments);
    } catch (err) {
      console.error('顧客詳細の取得に失敗しました', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await activityApi.getActivitiesByCompany(Number(id));
      setActivities(response.data.activities);
    } catch (err) {
      console.error('活動履歴の取得に失敗しました', err);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await activityApi.createActivity({
        companyId: Number(id),
        ...newActivity,
      });
      setShowActivityForm(false);
      setNewActivity({
        activityDate: new Date().toISOString().split('T')[0],
        activityType: 'phone',
        content: '',
        nextActionDate: '',
        nextActionContent: '',
      });
      fetchActivities();
    } catch (err: any) {
      alert(err.response?.data?.error || '活動履歴の作成に失敗しました');
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

  if (!company) {
    return <div className="error">顧客が見つかりません</div>;
  }

  return (
    <div className="company-detail">
      <div className="breadcrumb">
        <Link to="/companies">顧客一覧</Link> / {company.name}
      </div>

      <div className="detail-header">
        <h1>{company.name}</h1>
      </div>

      <div className="detail-grid">
        {/* 顧客情報 */}
        <section className="detail-section">
          <h2>顧客情報</h2>
          <dl className="detail-list">
            {company.phone && (
              <>
                <dt>電話番号</dt>
                <dd>{company.phone}</dd>
              </>
            )}
            {company.email && (
              <>
                <dt>メールアドレス</dt>
                <dd>{company.email}</dd>
              </>
            )}
            {company.address && (
              <>
                <dt>住所</dt>
                <dd>{company.address}</dd>
              </>
            )}
            {company.industry && (
              <>
                <dt>業種</dt>
                <dd>{company.industry}</dd>
              </>
            )}
          </dl>
        </section>

        {/* 担当者 */}
        {assignments.length > 0 && (
          <section className="detail-section">
            <h2>当方担当者</h2>
            <ul className="assignment-list">
              {assignments.map((assignment) => (
                <li key={assignment.id}>
                  {assignment.user_name}
                  {assignment.is_primary === 1 && <span className="badge">主担当</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* 活動履歴 */}
      <section className="activities-section">
        <div className="section-header">
          <h2>活動履歴</h2>
          <button onClick={() => setShowActivityForm(true)} className="btn btn-primary">
            活動を記録
          </button>
        </div>

        {activities.length === 0 ? (
          <p className="no-data">活動履歴がありません</p>
        ) : (
          <div className="activity-list">
            {activities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-header">
                  <span className="activity-type">{getActivityTypeLabel(activity.activity_type)}</span>
                  <span className="activity-date">{formatDate(activity.activity_date)}</span>
                </div>
                <p className="activity-content">{activity.content}</p>
                {activity.next_action_date && (
                  <div className="next-action">
                    <strong>次回アクション ({formatDate(activity.next_action_date)}):</strong>{' '}
                    {activity.next_action_content}
                  </div>
                )}
                <div className="activity-footer">
                  <span className="activity-user">{activity.user_name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 活動記録フォーム */}
      {showActivityForm && (
        <div className="modal-overlay" onClick={() => setShowActivityForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>活動を記録</h2>
            <form onSubmit={handleCreateActivity} className="activity-form">
              <div className="form-group">
                <label>対応日 *</label>
                <input
                  type="date"
                  value={newActivity.activityDate}
                  onChange={(e) => setNewActivity({ ...newActivity, activityDate: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>活動種別 *</label>
                <select
                  value={newActivity.activityType}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, activityType: e.target.value as any })
                  }
                  className="form-input"
                >
                  <option value="visit">訪問</option>
                  <option value="phone">電話</option>
                  <option value="email">メール</option>
                  <option value="web_meeting">Web会議</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <div className="form-group">
                <label>内容 *</label>
                <textarea
                  value={newActivity.content}
                  onChange={(e) => setNewActivity({ ...newActivity, content: e.target.value })}
                  required
                  rows={5}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>ネクストアクション日</label>
                <input
                  type="date"
                  value={newActivity.nextActionDate}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, nextActionDate: e.target.value })
                  }
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>ネクストアクション内容</label>
                <textarea
                  value={newActivity.nextActionContent}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, nextActionContent: e.target.value })
                  }
                  rows={3}
                  className="form-input"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowActivityForm(false)}
                  className="btn btn-secondary"
                >
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary">
                  登録
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDetailPage;
