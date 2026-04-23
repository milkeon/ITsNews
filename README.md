# 📰 ITsNews: 지능형 IT 뉴스 큐레이션 플랫폼

ITsNews는 수많은 IT 뉴스 소스로부터 핵심 정보를 자동으로 수집하고, 사용자의 취향에 맞는 뉴스를 추천해주는 프리미엄 큐레이션 서비스입니다.

---

## 🚀 기술 스택 (Tech Stack)

- **Frontend**: React (Vite), Zustand (상태 관리), Lucide React (아이콘)
- **Styling**: Vanilla CSS (Glassmorphism UI, Premium Dark/Light Mode)
- **Backend & Data**: Notion API (데이터베이스 연동), Serverless Functions (크롤링 프록시)
- **Scraping**: Universal Intelligent Scraper (구조적 클러스터링 및 휴리스틱 분석)

---

## 🛠️ 핵심 기능 및 함수 명세

### 1. 유니버설 지능형 스크래핑 (Intelligent Scraping)
특정 사이트의 구조에 의존하지 않고, 어떤 IT 뉴스 사이트에서도 스스로 기사 영역을 찾아내는 자율형 엔진입니다.

- **`fetchAndParse(url)`**: 사이트의 HTML 구조를 분석하여 반복되는 패턴(시그니처)을 감지하고, 제목/요약/이미지를 스스로 분리하여 추출합니다.
- **`loadData()`**: 여러 뉴스 출처로부터 동시에 데이터를 가져오며, 네트워크 부하를 줄이기 위해 캐싱 로직을 적용합니다.
- **`formatDisplayName(name)`**: URL 형태의 출처 주소를 '지디넷코리아', '아웃스탠딩' 같이 읽기 쉬운 한글 이름으로 자동 변환합니다.

### 2. 동적 필터링 및 소스 관리 (Source Management)
원하는 매체의 뉴스만 골라보거나, 새로운 뉴스 소스를 실시간으로 추가/삭제할 수 있습니다.

- **`addSource(url)`**: 새로운 뉴스 소스(URL)를 등록합니다. 등록 즉시 지능형 엔진이 해당 사이트를 분석하기 시작합니다.
- **`removeSource(id)`**: 구독 중인 뉴스 소스를 목록에서 제거합니다.
- **`toggleSourceFilter(name)`**: 특정 매체의 뉴스를 화면에서 보거나 가리는 토글 필터 기능을 수행합니다.

### 3. 프리미엄 뉴스 인터페이스 (Interactive UI)
가독성 높은 캐러셀과 그리드 레이아웃을 통해 최신 IT 트렌드를 한눈에 파악합니다.

- **`handleNext / handlePrev`**: 'HOT ISSUE' 캐러셀을 수동으로 제어하거나 8초 주기로 자동 전환합니다.
- **`handleImageError(e)`**: 크롤링된 이미지가 깨졌을 경우, 고화질 예비 이미지로 자동 교체하여 UI를 보호합니다.
- **`setVisibleCount(count)`**: 무한 스크롤 방식을 통해 사용자가 아래로 내려갈수록 더 많은 기사를 순차적으로 로드합니다.

### 4. 개인화 및 데이터 동기화 (Personalization & Sync)
좋아요를 누른 기사와 사용자 취향 데이터를 Notion DB와 실시간으로 동기화합니다.

- **`toggleArticleLike(article)`**: 마음에 드는 기사를 보관함에 추가하거나 제거합니다.
- **`incrementView(id)`**: 기사 열람 횟수를 트래킹하여 어떤 뉴스가 인기 있는지 실시간으로 반영합니다.
- **`syncWithNotion()`**: 로컬의 좋아요 목록과 설정을 Notion 데이터베이스와 양방향으로 동기화하여 어디서든 동일한 환경을 유지합니다.

### 5. 스마트 추천 시스템 (Recommendation Engine)
사용자가 읽은 기사와 등록한 키워드를 분석하여 연관성 높은 뉴스를 제안합니다.

- **`analyzeInterests()`**: 사용자의 좋아요 기록과 검색 키워드를 분석하여 관심 분야 가중치를 계산합니다.
- **`getRecommendations()`**: 분석된 데이터를 바탕으로 수집된 전체 뉴스 중 가장 적합한 기사를 우선 순위로 노출합니다.

### 6. 테마 및 환경 설정 (Environment Settings)
- **`toggleDarkMode()`**: 시스템 설정이나 사용자 취향에 맞춰 다크 모드와 라이트 모드를 즉시 전환합니다.
- **`showToast(message)`**: 모든 작업 결과(저장, 삭제 등)를 사용자에게 세련된 토스트 메시지로 알립니다.
