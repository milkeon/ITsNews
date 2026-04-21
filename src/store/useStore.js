import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 실제 삭제 대신 hidden 처리를 위한 데이터 구조 설계
export const useStore = create(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleDarkMode: () => {
        set((state) => {
          const nextMode = !state.isDarkMode;
          if(nextMode) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
          return { isDarkMode: nextMode };
        });
      },

      toastMessage: null,
      showToast: (message) => {
        set({ toastMessage: message });
        setTimeout(() => {
          set({ toastMessage: null });
        }, 3000); // 3초 뒤 사라짐
      },

      newsSources: [
        { id: 1, name: '요즘IT', url: 'https://yozm.wishket.com', hidden: false }
      ],
      addSource: (name, url) => set((state) => ({
        newsSources: [...state.newsSources, { id: Date.now(), name, url: url || name, hidden: false }]
      })),
      removeSource: (id) => set((state) => ({
        newsSources: state.newsSources.map(s => 
          s.id === id ? { ...s, hidden: true } : s
        )
      })),
      
      likedKeywords: [
        { id: 1, text: '스탠다드', hidden: false },
        { id: 2, text: '프론트엔드', hidden: false }
      ],
      addKeyword: (text) => set((state) => ({
        likedKeywords: [...state.likedKeywords, { id: Date.now(), text, hidden: false }]
      })),
      removeKeyword: (id) => set((state) => ({
        likedKeywords: state.likedKeywords.map(k => 
          k.id === id ? { ...k, hidden: true } : k
        )
      })),

      likedArticles: [],
      toggleArticleLike: (article) => set((state) => {
        const isLiked = state.likedArticles.some(a => a.id === article.id && !a.hidden);
        if (isLiked) {
          return {
            likedArticles: state.likedArticles.map(a => 
              a.id === article.id ? { ...a, hidden: true } : a
            )
          };
        } else {
          // 기존에 hidden 된게 있으면 다시 false로
          const exists = state.likedArticles.find(a => a.id === article.id);
          if (exists) {
            return {
              likedArticles: state.likedArticles.map(a => 
                a.id === article.id ? { ...a, hidden: false } : a
              )
            };
          }
          return {
            likedArticles: [...state.likedArticles, { ...article, hidden: false }]
          };
        }
      }),

      purgeBadData: () => set((state) => ({
        likedArticles: state.likedArticles.filter(a => {
          if (!a) return false;
          if (a.summary && a.summary.includes('가져온 진짜 기사입니다')) return false;
          if (a.title && (a.title.includes('[요즘IT]') || a.title.includes('GeekNews 서버에서'))) return false;
          return true;
        })
      })),

      articleViews: {},
      incrementView: (id) => set((state) => ({
        articleViews: { 
          ...state.articleViews, 
          [id]: (state.articleViews[id] || 0) + 1 
        }
      })),
    }),
    {
      name: 'itsnew-storage',
      // 메세지 같은 불필요한 상태는 저장하지 않고 영구 저장할 것들만 partialize
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        newsSources: state.newsSources,
        likedKeywords: state.likedKeywords,
        likedArticles: state.likedArticles,
        articleViews: state.articleViews
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.isDarkMode) {
          document.documentElement.classList.add('dark');
        }
      }
    }
  )
);
