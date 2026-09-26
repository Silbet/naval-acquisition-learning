import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Compass,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Anchor,
  BookOpen,
  Route as RouteIcon,
  Waves,
  Shield,
  LifeBuoy,
  Check,
  CheckCircle2,
  X,
  Trophy,
  Clock3,
  ExternalLink,
  RotateCcw,
  ChevronRight,
  Info,
  Map,
  History as HistoryIcon,
  Trash2,
} from "lucide-react";
import { units, pool, sources, type UnitId } from "./data";
import {
  createSession,
  loadSession,
  saveSession,
  clearSession,
  grade,
  scoreGrade,
  loadHistory,
  recordHistory,
  HISTORY_KEY,
  type Session,
} from "./domain";
import { registerLearningTools } from "./webmcp";
const icons = {
  book: BookOpen,
  shield: Shield,
  anchor: Anchor,
  waves: Waves,
  compass: Compass,
  route: RouteIcon,
  buoy: LifeBuoy,
};
const titleOf = (id: UnitId) => units.find((u) => u.id === id)!.title;
const date = (s: string) =>
  new Date(s).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
function Icon({ name, size = 24 }: { name: string; size?: number }) {
  const I = icons[name as keyof typeof icons] || Compass;
  return <I size={size} />;
}
function Dialog({
  title,
  children,
  onCancel,
  onConfirm,
  confirmLabel = "종료하기",
}: {
  title: string;
  children: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 id="dialog-title">{title}</h2>
      <div className="muted">{children}</div>
      <div className="actions">
        <button className="secondary" onClick={onCancel}>
          취소
        </button>
        <button className="primary" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
export default function App() {
  const location = useLocation();
  useEffect(registerLearningTools, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${location.pathname.startsWith("/quiz") ? "문제 풀기" : location.pathname.startsWith("/result") ? "학습 결과" : "획득절차 학습"} · 함정길잡이`;
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        본문으로 바로가기
      </a>
      <header className="header">
        <Link className="brand" to="/">
          <span className="brand-icon">
            <Compass />
          </span>
          <span>
            함정길잡이<small>함정사업 획득절차 학습</small>
          </span>
        </Link>
        <nav aria-label="주 메뉴">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "nav-active" : "")}
          >
            학습 단원
          </NavLink>
          <NavLink
            to="/map"
            className={({ isActive }) => (isActive ? "nav-active" : "")}
          >
            획득절차 맵
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => (isActive ? "nav-active" : "")}
          >
            학습 기록
          </NavLink>
        </nav>
        <span className="edition">LEARNING LOG / 01</span>
      </header>
      <main id="main" className="container" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setup/:unitId" element={<Setup />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/result" element={<Result />} />
          <Route path="/result/review" element={<Result review />} />
          <Route path="/map" element={<ProcessMap />} />
          <Route path="/history" element={<LearningHistory />} />
          <Route
            path="*"
            element={
              <Empty
                title="항로를 찾을 수 없습니다."
                text="주소를 확인하거나 학습 단원으로 돌아가 주세요."
              />
            }
          />
        </Routes>
      </main>
      <footer>
        <span>함정길잡이</span>
        <p>
          방위사업청 공개자료를 활용한 AI 콘테스트용 학습 프로토타입
          <br />
          공식 교육·평가 서비스가 아닙니다. 학습기록은 이 브라우저에만
          저장됩니다.
        </p>
        <Link to="/map">
          공개 출처 보기 <ExternalLink size={12} />
        </Link>
      </footer>
    </>
  );
}
function Home() {
  const history = loadHistory();
  const resume = loadSession();
  return (
    <>
      <div className="heading-row">
        <div>
          <p className="eyebrow">처음 만나는 함정사업</p>
          <h1>복잡한 절차, 한 문제씩 가까이.</h1>
          <p className="muted">배울 단원을 고르고 나만의 속도로 시작하세요.</p>
        </div>
        <span className="compass-decoration">
          <Compass size={68} />
        </span>
      </div>
      {resume && !resume.completedAt && (
        <Link to="/quiz" className="resume">
          <span>
            <Clock3 size={18} /> {titleOf(resume.unitId)} ·{" "}
            {resume.currentIndex + 1}/{resume.items.length}문제 진행 중
          </span>
          <strong>
            이어서 풀기 <ArrowRight size={16} />
          </strong>
        </Link>
      )}
      <section className="foundation">
        <div>
          <span className="light-label">
            <BookOpen size={16} /> 처음이라면 여기서
          </span>
          <h2>
            함정 획득절차
            <br />
            한눈에 보기
          </h2>
          <p>
            사업의 시작부터 함정 인도까지,
            <br />
            전체 흐름을 먼저 연결해 보세요.
          </p>
          <Link to="/setup/common-process" className="mint-button">
            공통 절차 학습하기 <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="route-graphic">
          {[
            "소요 결정",
            "선행연구",
            "기본설계",
            "상세설계·건조",
            "시험평가",
          ].map((s, i) => (
            <div key={s}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <strong>{s}</strong>
            </div>
          ))}
          <p>연구개발 방식의 주요 단계를 단순화한 학습 항로</p>
        </div>
      </section>
      <div className="section-heading">
        <h2>함종별 학습</h2>
        <span className="muted">6개 단원 · 5 / 10 / 20문제</span>
      </div>
      <section className="unit-grid" aria-label="함종별 학습 단원">
        {units.slice(1).map((u, i) => {
          const records = history.filter((h) => h.unitId === u.id && !h.retry);
          return (
            <Link className="unit-card" to={`/setup/${u.id}`} key={u.id}>
              <div className="card-top">
                <span className="unit-icon">
                  <Icon name={u.icon} size={27} />
                </span>
                <span className="unit-index">UNIT 0{i + 1}</span>
              </div>
              <h3>{u.title}</h3>
              <p>{u.summary}</p>
              <div className="card-bottom">
                <span>
                  {records.length
                    ? `시연 최고 ${Math.max(...records.map((h) => h.score))}점`
                    : "아직 학습 전"}
                  <small>
                    공통 {pool("common-process", true).length} + 사례{" "}
                    {pool(u.id, true).filter((q) => q.unitId === u.id).length} ·
                    시연용
                  </small>
                </span>
                <ArrowUpRight size={20} />
              </div>
            </Link>
          );
        })}
      </section>
      <aside className="notice">
        <Info size={18} />
        <p>
          현재는 <strong>시연용 문제은행</strong>입니다. 방위사업청 공개자료로
          작성한 문항은 사람 검수 후 정식 학습에 반영됩니다.
        </p>
      </aside>
    </>
  );
}
function Setup() {
  const { unitId } = useParams();
  const unit = units.find((u) => u.id === unitId);
  const [count, setCount] = useState(5),
    [demo, setDemo] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  if (!unit)
    return (
      <Empty
        title="없는 학습 단원입니다."
        text="단원 목록에서 다시 선택해 주세요."
      />
    );
  const available = pool(unit.id, demo);
  const caseCount = Math.min(
    available.filter(
      (q) => q.unitId === unit.id && q.unitId !== "common-process",
    ).length,
    Math.ceil(count / 2),
  );
  function start() {
    try {
      const session = createSession(unit!.id, count, demo);
      if (!saveSession(session)) {
        setError(
          "브라우저의 세션 저장을 사용할 수 없습니다. 사이트 저장소를 허용하고 다시 시도해 주세요.",
        );
        return;
      }
      navigate("/quiz");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="narrow">
      <Link className="back" to="/">
        <ArrowLeft size={17} /> 단원 다시 선택
      </Link>
      <div className="setup-title">
        <span className="unit-icon large">
          <Icon name={unit.icon} size={32} />
        </span>
        <p className="eyebrow">오늘의 학습 항로</p>
        <h1>{unit.title}</h1>
        <p className="muted">{unit.summary}</p>
      </div>
      <section className="white-panel">
        <h2>얼마나 풀어볼까요?</h2>
        <p className="muted">
          모두 4지선다입니다. 문제와 보기는 매번 새롭게 섞입니다.
        </p>
        <label className="demo-consent">
          <input
            type="checkbox"
            checked={demo}
            onChange={(e) => setDemo(e.target.checked)}
          />
          <span>
            <strong>시연용 문제로 연습하기</strong>
            <small>
              사람 검수 전 문항임을 확인했습니다. 정식 검수 완료:{" "}
              {pool(unit.id).length}개
            </small>
          </span>
        </label>
        <fieldset className="count-group">
          <legend className="sr-only">문제 수 선택</legend>
          {([5, 10, 20] as const).map((n, i) => (
            <label
              className={`count-option ${count === n ? "selected" : ""} ${available.length < n ? "unavailable" : ""}`}
              key={n}
            >
              <input
                type="radio"
                name="count"
                value={n}
                checked={count === n}
                disabled={available.length < n}
                onChange={() => setCount(n)}
              />
              <span className="count-number">
                {n}
                <small>문제</small>
              </span>
              <span>
                <Clock3 size={14} /> 약 {[3, 5, 10][i]}분
              </span>
              {count === n && (
                <CheckCircle2 className="count-check" size={18} />
              )}
            </label>
          ))}
        </fieldset>
        {!demo && (
          <p className="hint">
            정식 문제은행은 검수 중입니다. 시연용 연습을 선택하면 5·10·20문제를
            풀 수 있습니다.
          </p>
        )}
        <div className="setup-summary">
          <span>출제 구성</span>
          <strong>
            {unit.id === "common-process"
              ? "공통 획득절차"
              : `함종 사례 ${caseCount} + 공통 절차 ${count - caseCount}`}
          </strong>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button
          className="primary full"
          disabled={available.length < count}
          onClick={start}
        >
          학습 시작하기 <ArrowRight size={18} />
        </button>
        <p className="center hint">
          점수는 마지막 문제를 제출한 뒤 확인할 수 있어요.
        </p>
      </section>
    </div>
  );
}
function Quiz() {
  const [session, setSession] = useState<Session | null>(loadSession);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const heading = useRef<HTMLHeadingElement>(null);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !!loadSession() &&
      !loadSession()?.completedAt &&
      currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    heading.current?.focus();
  }, [session?.currentIndex]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (!loadSession()?.completedAt) e.preventDefault();
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, []);
  function change(next: Session) {
    if (!saveSession(next)) {
      setError("진행 상황을 저장하지 못했습니다. 저장소 설정을 확인해 주세요.");
      return false;
    }
    setSession(next);
    return true;
  }
  function choose(i: number) {
    if (!session) return;
    const answers = [...session.answers];
    answers[session.currentIndex] = i;
    change({ ...session, answers });
  }
  function next() {
    if (!session || session.answers[session.currentIndex] === null) return;
    if (session.currentIndex < session.items.length - 1)
      change({ ...session, currentIndex: session.currentIndex + 1 });
    else {
      const done = { ...session, completedAt: new Date().toISOString() };
      if (change(done)) {
        recordHistory(done);
        navigate("/result", { replace: true });
      }
    }
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.repeat ||
        blocker.state === "blocked"
      )
        return;
      const target = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "BUTTON", "A", "SUMMARY"].includes(target.tagName)
      )
        return;
      if (/^[1-4]$/.test(e.key)) {
        e.preventDefault();
        choose(Number(e.key) - 1);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  if (!session) return <Navigate to="/" replace />;
  if (session.completedAt) return <Navigate to="/result" replace />;
  const q = session.items[session.currentIndex],
    selected = session.answers[session.currentIndex];
  return (
    <div className="quiz-wrap">
      <div className="quiz-top">
        <Link to="/" className="back">
          <X size={18} /> 학습 종료
        </Link>
        <span>
          {titleOf(session.unitId)}{" "}
          {session.demo && <b className="demo-tag">시연</b>}
        </span>
      </div>
      <div className="progress-label">
        <span>학습 진행</span>
        <strong>
          {session.currentIndex + 1}
          <span> / {session.items.length}</span>
        </strong>
      </div>
      <progress
        max={session.items.length}
        value={session.currentIndex + 1}
        aria-label="문제 진행률"
      />
      <section className="question-panel">
        <div className="question-meta">
          <span className="stage-tag">{q.stage}</span>
          <span>
            {q.unitId === "common-process" ? "공통 절차" : "함종 사례"} · 객관식
          </span>
        </div>
        <span className="question-number">
          QUESTION {String(session.currentIndex + 1).padStart(2, "0")}
        </span>
        <h1 ref={heading} tabIndex={-1}>
          {q.prompt}
        </h1>
        <fieldset className="answers">
          <legend className="sr-only">답 선택</legend>
          {q.options.map((text, i) => (
            <label
              className={`answer ${selected === i ? "selected" : ""}`}
              key={i}
            >
              <input
                type="radio"
                name={q.id}
                checked={selected === i}
                onChange={() => choose(i)}
              />
              <span className="answer-index">{i + 1}</span>
              <span>{text}</span>
              {selected === i && (
                <CheckCircle2 size={20} className="answer-check" />
              )}
            </label>
          ))}
        </fieldset>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="question-bottom">
          <span className="hint">숫자 1–4 선택 · Enter 다음</span>
          <button
            className="primary"
            onClick={next}
            disabled={selected === null}
          >
            {session.currentIndex === session.items.length - 1
              ? "답안 제출"
              : "다음 문제"}{" "}
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
      <p className="center hint">
        공개자료 기반 시연용 연습 · 정답과 출처는 제출 후 확인합니다.
      </p>
      {blocker.state === "blocked" && (
        <Dialog
          title="이번 학습을 종료할까요?"
          onCancel={() => blocker.reset()}
          onConfirm={() => {
            clearSession();
            blocker.proceed();
          }}
        >
          현재 회차의 답안은 지워집니다. 완료한 학습 기록은 유지됩니다.
        </Dialog>
      )}
    </div>
  );
}
function Result({ review = false }: { review?: boolean }) {
  const [s] = useState(loadSession);
  const [checked, setChecked] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const nav = useNavigate();
  if (!s?.completedAt) return <Navigate to="/" replace />;
  const r = grade(s);
  function retry(wrong = false) {
    try {
      const session = createSession(
        s!.unitId,
        wrong ? r.wrong.length : s!.items.length,
        s!.demo,
        wrong
          ? r.wrong.map((q) => q.id)
          : s!.retry
            ? s!.items.map((q) => q.id)
            : undefined,
      );
      if (!saveSession(session)) throw Error("새 회차를 저장할 수 없습니다.");
      nav("/quiz");
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  return (
    <div className="result-wrap">
      <div className="result-heading">
        <span className="eyebrow">
          {s.demo ? "시연용 학습 결과" : "학습 결과"} · {titleOf(s.unitId)}
          {s.retry ? " · 오답 재도전" : ""}
        </span>
        <h1>
          {r.score >= 80
            ? "좋아요, 한 걸음 더 나아갔어요."
            : "다음 항해는 더 익숙해질 거예요."}
        </h1>
        <p className="muted">
          틀린 문제의 이유를 확인하면, 절차가 더 선명해집니다.
        </p>
      </div>
      <section className="score-panel">
        <div className="score-mark">
          <Trophy size={28} />
          <div>
            <strong>{r.score}</strong>
            <span>점</span>
          </div>
          <p>{scoreGrade(r.score)}</p>
        </div>
        <div className="score-detail">
          <div className="score-stats">
            <div>
              <span>정답</span>
              <strong className="teal">
                {r.correct}
                <small>문제</small>
              </strong>
            </div>
            <div>
              <span>오답</span>
              <strong>
                {r.wrong.length}
                <small>문제</small>
              </strong>
            </div>
            <div>
              <span>풀이</span>
              <strong>
                {r.total}
                <small>문제</small>
              </strong>
            </div>
          </div>
          <p className="muted">
            {r.wrong.length
              ? "기억이 헷갈렸던 단계만 가볍게 복습해 보세요."
              : "모든 문제를 맞혔습니다. 다른 함종의 사례도 살펴보세요."}
          </p>
          <span className="hint">
            {date(s.completedAt)} 완료 ·{" "}
            {s.demo ? "사람 검수 전 시연 문항" : "검수 완료 문항"}
          </span>
        </div>
      </section>
      {err && (
        <p role="alert" className="error">
          {err}
        </p>
      )}
      <div className="result-actions">
        <Link className="primary" to="/result/review">
          <BookOpen size={18} />{" "}
          {r.wrong.length ? "오답 복습하기" : "해설 확인하기"}
        </Link>
        {r.wrong.length > 0 && (
          <button className="secondary" onClick={() => retry(true)}>
            <RotateCcw size={17} /> 틀린 문제 다시 풀기
          </button>
        )}
        <button className="secondary" onClick={() => retry()}>
          같은 조건으로 다시 풀기
        </button>
        <Link className="text-button" to="/">
          다른 단원 선택 <ArrowRight size={16} />
        </Link>
      </div>
      {review && (
        <section className="review-list">
          <div className="section-heading">
            <h2>
              {r.wrong.length
                ? `오답 복습 ${r.wrong.length}`
                : "모두 정답이에요! 해설도 확인해 보세요."}
            </h2>
            <span className="muted">공식 출처와 함께 확인</span>
          </div>
          {(r.wrong.length ? r.wrong : s.items).map((q) => {
            const i = s.items.findIndex((x) => x.id === q.id);
            const source = sources[q.sourceId];
            return (
              <article className="review-card" key={q.id}>
                <div className="question-meta">
                  <span className="stage-tag">{q.stage}</span>
                  <span>문제 {i + 1}</span>
                </div>
                <h3>{q.prompt}</h3>
                <div className="review-answers">
                  {s.answers[i] !== q.answerIndex && (
                    <p className="incorrect">
                      <X size={17} /> 나의 답: {q.options[s.answers[i]!]}
                    </p>
                  )}
                  <p className="correct">
                    <Check size={17} /> 정답: {q.options[q.answerIndex]}
                  </p>
                </div>
                <p>{q.explanation}</p>
                <a
                  className="source-link"
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  방위사업청 · {source.title} <ExternalLink size={14} />
                  <span className="sr-only">(새 창)</span>
                </a>
                <div className="review-footer">
                  <small>
                    {source.date ? `자료 게시 ${source.date}` : "게시일 미표기"}{" "}
                    · 근거 확인 2026-09-26
                  </small>
                  <label>
                    <input
                      type="checkbox"
                      checked={checked.includes(q.id)}
                      onChange={(e) =>
                        setChecked(
                          e.target.checked
                            ? [...checked, q.id]
                            : checked.filter((id) => id !== q.id),
                        )
                      }
                    />{" "}
                    복습 완료
                  </label>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
const processSteps = [
  {
    title: "소요제기·결정",
    description: "필요를 제기하고, 어떤 전력을 확보할지 결정합니다.",
    source: "management",
    detail:
      "공개 사업관리 안내의 주요 주체는 소요군·기관과 합동참모본부입니다.",
  },
  {
    title: "선행연구·개념설계",
    description: "사업을 추진할 방향과 기본 전략을 살펴봅니다.",
    source: "process",
    detail: "함정 연구개발 절차도에는 선행연구와 개념설계가 함께 표시됩니다.",
  },
  {
    title: "기본설계",
    description: "상세설계로 넘어가기 전 함정의 설계를 구체화합니다.",
    source: "mine",
    detail:
      "소해함 기본설계 착수 사례에서 이후 상세설계·건조 계획을 확인할 수 있습니다.",
  },
  {
    title: "상세설계·선도함 건조",
    description: "설계를 발전시키고 첫 번째 함정을 건조합니다.",
    source: "frigate",
    detail: "충남함 자료는 체계개발을 상세설계 및 선도함 건조로 설명합니다.",
  },
  {
    title: "시험평가·인도",
    description: "함정을 평가하고 인수 기관에 넘깁니다.",
    source: "destroyer",
    detail: "정조대왕함은 진수 후 시험평가를 거쳐 해군에 인도한 사례입니다.",
  },
  {
    title: "운용·지원과 후속함",
    description: "운용을 준비하고, 후속함·지원과 연계합니다.",
    source: "support",
    detail:
      "후속함 사업과 시험·건조 일정은 겹칠 수 있습니다. 이 도식은 획일적인 법정 순서를 뜻하지 않습니다.",
  },
] as const;
function ProcessMap() {
  return (
    <>
      <Link className="back" to="/">
        <ArrowLeft size={17} /> 학습 단원
      </Link>
      <div className="heading-row">
        <div>
          <p className="eyebrow">큰 흐름부터 연결하기</p>
          <h1>함정 한 척이 오기까지</h1>
          <p className="muted">
            연구개발 방식의 주요 개념을 연결한 학습용 요약입니다.
          </p>
        </div>
        <Map size={54} className="compass-decoration" />
      </div>
      <div className="process-list">
        {processSteps.map((s, i) => (
          <article key={s.title} className="process-step">
            <span className="step-circle">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h2>{s.title}</h2>
              <p>{s.description}</p>
              <p className="muted">{s.detail}</p>
              <a
                href={sources[s.source].url}
                className="source-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                공식 근거 보기 <ExternalLink size={14} />
                <span className="sr-only">(새 창)</span>
              </a>
            </div>
          </article>
        ))}
      </div>
      <aside className="notice">
        <Info size={20} />
        <p>
          사업 방식에 따라 절차가 다릅니다. 잠수함용예인정-II는{" "}
          <a
            className="inline-link"
            href={sources.tug.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            구매방식을 적용한 공개 사례(새 창)
          </a>
          입니다. 모든 함정이 위 경로를 그대로 따른다고 일반화하지 않습니다.
        </p>
      </aside>
      <Link className="primary" to="/setup/common-process">
        공통 절차 문제 풀기 <ArrowRight size={18} />
      </Link>
      <section className="sources-section">
        <h2>문제은행의 공개 출처</h2>
        <p className="muted">
          총 {Object.keys(sources).length}개 출처 · AI 근거 대조 2026-09-26 ·
          사람 검수 대기
        </p>
        {Object.entries(sources).map(([id, s]) => (
          <a
            key={id}
            className="source-row"
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>
              {s.title}
              <small>방위사업청 · {s.date || "게시일 미표기"}</small>
            </span>
            <ExternalLink size={17} />
            <span className="sr-only">새 창</span>
          </a>
        ))}
      </section>
    </>
  );
}
function LearningHistory() {
  const [history, setHistory] = useState(loadHistory);
  const [confirm, setConfirm] = useState(false);
  const weak = Object.entries(
    history
      .flatMap((h) => h.weakStages)
      .reduce<Record<string, number>>(
        (a, s) => ({ ...a, [s]: (a[s] || 0) + 1 }),
        {},
      ),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  return (
    <>
      <div className="heading-row">
        <div>
          <p className="eyebrow">조금씩 쌓이는 나의 항해</p>
          <h1>학습 기록</h1>
          <p className="muted">
            이 브라우저에 저장된 최근 100회 기록입니다. 시연 결과는 공식 평가가
            아닙니다.
          </p>
        </div>
        {history.length > 0 && (
          <button className="text-button" onClick={() => setConfirm(true)}>
            <Trash2 size={16} /> 기록 지우기
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <Empty
          title="첫 번째 항해를 기다리고 있어요."
          text="단원을 골라 문제를 풀면 이곳에 기록이 남습니다."
        />
      ) : (
        <>
          <div className="history-summary">
            <div>
              <span>완료한 학습</span>
              <strong>
                {history.length}
                <small>회</small>
              </strong>
            </div>
            <div>
              <span>풀어본 문제</span>
              <strong>
                {history.reduce((n, h) => n + h.total, 0)}
                <small>개</small>
              </strong>
            </div>
            <div>
              <span>평균 점수</span>
              <strong>
                {Math.round(
                  history.reduce((n, h) => n + h.score, 0) / history.length,
                )}
                <small>점</small>
              </strong>
            </div>
          </div>
          {weak.length > 0 && (
            <aside className="notice">
              <BookOpen size={20} />
              <p>
                다시 살펴보면 좋은 단계:{" "}
                <strong>{weak.map(([s]) => s).join(" · ")}</strong>
                <br />
                <Link to="/map" className="inline-link">
                  획득절차 맵에서 복습하기
                </Link>
              </p>
            </aside>
          )}
          <div className="history-list">
            {history.map((h) => (
              <article key={h.id}>
                <span className="history-icon">
                  <HistoryIcon size={20} />
                </span>
                <div>
                  <h3>
                    {titleOf(h.unitId)} {h.retry && <small>오답 재도전</small>}
                  </h3>
                  <p>
                    {date(h.completedAt)} · {h.correct}/{h.total}문제 ·{" "}
                    {h.demo ? "시연" : "정식"}
                  </p>
                </div>
                <strong>
                  {h.score}
                  <small>점</small>
                </strong>
                <Link
                  to={`/setup/${h.unitId}`}
                  aria-label={`${titleOf(h.unitId)} 다시 학습`}
                >
                  <ChevronRight size={22} />
                </Link>
              </article>
            ))}
          </div>
        </>
      )}
      {confirm && (
        <Dialog
          title="학습 기록을 지울까요?"
          confirmLabel="기록 지우기"
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            try {
              localStorage.removeItem(HISTORY_KEY);
              setHistory([]);
            } catch {
              /* disabled storage */
            }
            setConfirm(false);
          }}
        >
          이 브라우저의 완료 기록이 삭제됩니다. 삭제한 기록은 복구할 수
          없습니다.
        </Dialog>
      )}
    </>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <Compass size={46} />
      <h1>{title}</h1>
      <p className="muted">{text}</p>
      <Link className="primary" to="/">
        학습 단원으로 <ArrowRight size={16} />
      </Link>
    </div>
  );
}
