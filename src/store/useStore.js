import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as notionApi from '../notionApi';

export const useStore = create(
  persist(
    (set, get) => ({
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

      // 통합된 Notion 데이터 로드
      fetchNotionData: async () => {
        const { sources, keywords, articles } = await notionApi.fetchAllNotionData();
        
        set({
          newsSources: sources.length > 0 ? sources : get().newsSources,
          likedKeywords: keywords,
          likedArticles: articles
        });
      },

      cachedMasterList: [],
      setCachedMasterList: (list) => set({ cachedMasterList: list }),

      newsSources: [
        { id: 1, name: '요즘IT', url: 'https://yozm.wishket.com', hidden: false }
      ],
      addSource: async (name, url) => {
        const tempId = Date.now();
        set((state) => ({
          newsSources: [...state.newsSources, { id: tempId, name, url: url || name, hidden: false }]
        }));
        
        const realId = await notionApi.addSourceToNotion(name, url || name);
        if (realId) {
          set((state) => ({
            newsSources: state.newsSources.map(s => s.id === tempId ? { ...s, id: realId } : s),
            cachedMasterList: []
          }));
        }
      },
      removeSource: async (id) => {
        set((state) => ({
          newsSources: state.newsSources.map(s => 
            s.id === id ? { ...s, hidden: true } : s
          ),
          cachedMasterList: []
        }));
        await notionApi.hideNotionPage(id);
      },
      
      likedKeywords: [],
      addKeyword: async (text) => {
        const tempId = Date.now();
        set((state) => ({
          likedKeywords: [...state.likedKeywords, { id: tempId, text, hidden: false }]
        }));
        
        const realId = await notionApi.addKeywordToNotion(text);
        if (realId) {
          set((state) => ({
            likedKeywords: state.likedKeywords.map(k => k.id === tempId ? { ...k, id: realId } : k)
          }));
        }
      },
      removeKeyword: async (id) => {
        set((state) => ({
          likedKeywords: state.likedKeywords.map(k => 
            k.id === id ? { ...k, hidden: true } : k
          )
        }));
        await notionApi.hideNotionPage(id);
      },

      likedArticles: [],
      toggleArticleLike: async (article) => {
        const isLiked = get().likedArticles.some(a => a.id === article.id && !a.hidden);
        
        if (isLiked) {
          const target = get().likedArticles.find(a => a.id === article.id);
          set((state) => ({
            likedArticles: state.likedArticles.map(a => 
              a.id === article.id ? { ...a, hidden: true } : a
            )
          }));
          if (target && target.notionPageId) {
            await notionApi.hideNotionPage(target.notionPageId);
          }
        } else {
          const exists = get().likedArticles.find(a => a.id === article.id);
          if (exists) {
            set((state) => ({
              likedArticles: state.likedArticles.map(a => 
                a.id === article.id ? { ...a, hidden: false } : a
              )
            }));
            if (exists.notionPageId) {
              await notionApi.unhideNotionPage(exists.notionPageId);
            }
          } else {
            set((state) => ({
              likedArticles: [{ ...article, hidden: false, likedAt: Date.now() }, ...state.likedArticles]
            }));
            const realId = await notionApi.addArticleToNotion(article);
            if (realId) {
              set((state) => ({
                likedArticles: state.likedArticles.map(a => 
                  a.id === article.id ? { ...a, notionPageId: realId } : a
                )
              }));
            }
          }
        }
      },

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
      name: 'itsnews-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
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
