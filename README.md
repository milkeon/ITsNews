# 🚀 ITsNews (IT 뉴스 큐레이션 플랫폼)

ITsNews는 여러 IT 뉴스 사이트의 정보를 지능적으로 스크래핑하여 사용자 맞춤형 피드를 제공하고, Notion API를 통해 나만의 뉴스 아카이브를 구축하는 프리미엄 큐레이션 서비스입니다.

---

## 🛠 기술 스택
- **Core**: React, Vite, JavaScript (ES6+)
- **State**: Zustand (Persistence State Management)
- **Database**: Notion API (Database as a Service)
- **UI/UX**: Vanilla CSS (Custom Design System, Glassmorphism)
- **Deployment**: Vercel Serverless Functions

---

## 🌟 핵심 기능 및 기술 구현 상세

### 1. 지능형 썸네일 추출 엔진 (Scoring System v2)
단순한 태그 추출을 넘어, 웹 페이지 내의 모든 요소를 분석하여 가장 적절한 썸네일을 스스로 판단합니다.

#### 💻 핵심 코드 (Thumbnail Scoring)
```javascript
// 각 요소의 점수를 계산하여 최적의 썸네일 선발
allElements.forEach(el => {
  let url = getUrl(el); // src, data-src, background-image 등 추출
  let score = 0;

  // 1. 기사 사진 특유의 경로 가점 (가장 강력한 지표)
  if (['upload', 'article', 'news', 'content'].some(k => url.includes(k))) score += 25;
  
  // 2. 썸네일 관련 키워드 가점
  if (['thumb', 'poster', 'main', 'photo'].some(k => combinedInfo.includes(k))) score += 15;
  
  // 3. 로고/아이콘 등 불필요한 요소 대폭 감점
  if (['logo', 'icon', 'avatar', 'nav'].some(k => combinedInfo.includes(k))) score -= 60;
  
  candidates.push({ url, score });
});
```
#### 🔍 상세 설명
- **멀티 속성 탐색**: `data-original`, `data-lazy-src` 등 현대 웹사이트의 다양한 지연 로딩(Lazy Loading) 방식을 모두 지원합니다.
- **맥락 분석**: 이미지의 URL 뿐만 아니라 부모 요소의 클래스명, ID, Alt 속성을 종합적으로 분석하여 로고와 진짜 기사 사진을 구분합니다.
- **배경 이미지 지원**: `<img>` 태그가 아닌 CSS `background-image`로 처리된 고화질 썸네일(예: Techbrew, 블로터)도 완벽하게 추출합니다.

---

### 2. Notion API 연동 및 데이터 동기화
로컬 스토리지의 한계를 극복하고, 사용자의 Notion 데이터베이스에 기사를 영구 저장합니다.

#### 💻 핵심 코드 (Add to Notion)
```javascript
// 기사 정보를 Notion DB 형식에 맞춰 전송
const response = await fetch('/api/notion', {
  method: 'POST',
  body: JSON.stringify({
    properties: {
      Name: { title: [{ text: { content: article.title } }] },
      URL: { url: article.url },
      Publisher: { rich_text: [{ text: { content: article.source } }] },
      Image: { url: article.img || '' },
      PublishedAt: { rich_text: [{ text: { content: article.date } }] }
    }
  })
});
```
#### 🔍 상세 설명
- **데이터 매핑**: 각 언론사마다 제각각인 데이터 형식(Source, Publisher, Author 등)을 Notion의 정형화된 데이터베이스 구조로 통일하여 저장합니다.
- **서버리스 프록시**: Vercel Serverless Function을 통해 CORS 이슈 없이 안전하게 Notion API와 통신합니다.

---

### 3. 최신순 정렬 및 타임스탬프 로직
사용자가 가장 최근에 관심을 가진 정보가 항상 최상단에 노출되도록 제어합니다.

#### 💻 핵심 코드 (Latest Sort)
```javascript
// Notion의 생성 시각(created_time)을 기준으로 내림차순 정렬
const sorted = data.sort((a, b) => {
  const timeA = a.likedAt || 0;
  const timeB = b.likedAt || 0;
  return timeB - timeA; // 최신 데이터가 위로
});
```
#### 🔍 상세 설명
- **시스템 시간 활용**: 별도의 정렬 컬럼 없이도 Notion의 내장 시스템 속성인 `created_time`을 추출하여 정밀한 정렬을 수행합니다.
- **실시간 반영**: 좋아요를 누르는 즉시 `likedAt` 타임스탬프를 부여하여 페이지 새로고침 없이도 UI에서 즉각적인 정렬 피드백을 제공합니다.

---

### 4. 고유 이미지 해싱 (Fallback System)
이미지를 찾을 수 없는 기사에도 시각적 일관성을 제공하기 위해 고유한 랜덤 이미지를 배정합니다.

#### 💻 핵심 코드 (Image Hashing)
```javascript
// URL 문자열을 기반으로 고유한 해시값을 생성하여 이미지 배정
const getHashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const displayImg = article.img || stableImages[getHashCode(article.url) % stableImages.length];
```
#### 🔍 상세 설명
- **결정적 랜덤**: 단순히 무작위 이미지를 보여주는 것이 아니라, 특정 기사(URL)는 항상 동일한 테마 이미지를 갖도록 설계하여 사용자 혼란을 방지합니다.
- **디자인 밸런스**: 썸네일이 없는 기사가 많아도 전체적인 그리드 레이아웃의 미학적 완성도를 유지합니다.

---

### 5. 지능형 관심사 분석 및 맞춤 추천 엔진
사용자의 활동 데이터(좋아요, 키워드)를 다차원으로 분석하여 개인화된 IT 인사이트를 제공합니다.

#### 💻 핵심 코드 (Interest Analysis)
```javascript
// 카테고리별 가중치 기반 관심도 점수 계산
const analyzeInterests = () => {
  const texts = activeArticles.map(a => a.title + " " + a.summary).join(' ');
  const predefinedCategories = {
    '인공지능/AI': ['AI', '인공지능', '챗GPT', 'GPT', '모델', 'LLM'],
    '개발/프로그래밍': ['개발', '프론트엔드', '백엔드', '코딩', '코드', '리액트'],
    // ... 카테고리 정의
  };
  
  // 키워드 가중치(20점) + 본문 빈도 가중치(5점) 합산 로직
  Object.keys(predefinedCategories).forEach(cat => {
    predefinedCategories[cat].forEach(word => {
      const matches = texts.match(new RegExp(word, 'gi'));
      if (matches) scores[cat] = (scores[cat] || 0) + (matches.length * 5);
    });
  });
  
  return calculatePercentage(scores); // 상대적 비율로 시각화 데이터 반환
};
```
#### 🔍 상세 설명
- **가중치 기반 분류**: 단순히 단어의 개수를 세는 것이 아니라, 사용자가 명시한 '관심 키워드'에는 더 높은 가중치를 부여하여 분석의 정확도를 높였습니다.
- **다차원 카테고리 매핑**: AI, 개발, 클라우드, 트렌드, 보안 등 5대 핵심 IT 분야로 사용자의 관심을 자동 분류합니다.
- **인사이트 시각화**: 분석된 점수를 퍼센티지(%)로 환산하여 사용자가 자신의 관심 분포를 한눈에 파악할 수 있도록 프로그레스 바 형태의 UI를 제공합니다.


## 📂 프로젝트 파일 구조
- `src/pages/Home.jsx`: 지능형 스크래핑 엔진 및 메인 피드 제어
- `src/pages/Likes.jsx`: 아카이브 목록 렌더링 및 해시 기반 이미지 처리
- `src/notionApi.js`: API 통신 및 다국어 속성(이미지, 출처 등) 매핑
- `src/store/useStore.js`: Zustand 기반 전역 상태 및 데이터 영속성 관리

---
*이 문서는 시스템의 기술적 진보를 반영하여 지속적으로 업데이트됩니다.*
