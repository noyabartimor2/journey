// PREVIEW ONLY: the same functions as api-supabase.js, but everything lives in memory with sample content.
// Used for the design preview, so screens can be tried without accounts.
import { days as sampleDays } from '../data/days.js';
import { libraryItems } from '../data/library.js';
import { samplePosts, currentUser } from '../data/community.js';
import { previewActivation } from './schedule.js';

const wait = (ms = 150) => new Promise((r) => setTimeout(r, ms));
const listeners = new Set();

const state = {
  stage: 'app',           // 'signin' | 'waiting' | 'app'
  day: 3,
  profile: { id: 'me', email: currentUser.email, name: currentUser.name, photo: null },
  progress: new Set([1, 2]),
  private: { day1Video: null, day9Video: null, answers: {}, ritual: null },
  posts: samplePosts().map((p) => ({ ...p, commentCount: p.comments.length })),
};

function notify() { listeners.forEach((cb) => cb(state.stage === 'signin' ? null : { id: 'me', email: state.profile.email })); }

export const api = {
  isPreview: true,
  googleEnabled: true,

  // Preview controls
  preview: {
    get stage() { return state.stage; },
    get day() { return state.day; },
    setStage(s) { state.stage = s; notify(); },
    setDay(d) {
      state.day = d; state.stage = 'app';
      state.progress = new Set(Array.from({ length: d - 1 }, (_, i) => i + 1));
      notify();
    },
  },

  async init() { return state.stage === 'signin' ? null : { id: 'me', email: state.profile.email }; },
  onAuthChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },
  async signInEmail() { await wait(400); },
  async signInGoogle() { state.stage = 'waiting'; notify(); },
  async signOut() { state.stage = 'signin'; notify(); },

  async loadMe() {
    await wait();
    const approved = state.stage === 'app';
    return {
      user: { id: 'me', email: state.profile.email },
      isAdmin: false,
      profile: {
        ...state.profile,
        status: approved ? 'approved' : 'pending',
        activatedAt: approved ? previewActivation(state.day) : null,
      },
    };
  },
  async updateProfile({ name, photoFile }) {
    if (typeof name === 'string') state.profile.name = name.trim();
    if (photoFile) state.profile.photo = URL.createObjectURL(photoFile);
  },

  async loadDays() {
    await wait();
    return sampleDays.filter((d) => d.number <= state.day).map((d) => ({ ...d, video: { art: d.video.art, source: null } }));
  },
  async loadProgress() { return new Set(state.progress); },
  async setDone(day, done) { await wait(80); if (done) state.progress.add(day); else state.progress.delete(day); },

  async loadPrivate() { return { ...state.private }; },
  async savePrivateVideo(kind, file) {
    await wait(700);
    const v = { url: URL.createObjectURL(file), at: new Date().toISOString() };
    state.private[kind === 'day1_video' ? 'day1Video' : 'day9Video'] = v;
    return v;
  },
  async savePrivateData(kind, data) {
    await wait(200);
    if (kind === 'purpose_answers') state.private.answers = data.answers;
    if (kind === 'ritual') state.private.ritual = data;
  },

  async loadFeed() {
    await wait();
    return state.posts
      .filter((p) => !p.day || p.day <= state.day || p.author.id === 'me')
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((p) => ({ ...p, mine: p.author.id === 'me' }));
  },
  async createPost({ text, day, label, files }) {
    await wait(files.some((f) => f.kind === 'video') ? 1200 : 400);
    state.posts.unshift({
      id: `p${Date.now()}`, author: { id: 'me', name: state.profile.name, photo: state.profile.photo }, createdAt: Date.now(),
      day: day || null, label: label || null, text,
      media: files.map((f) => ({ type: f.kind, url: URL.createObjectURL(f.file), duration: f.duration })),
      likes: 0, likedByMe: false, comments: [], commentCount: 0,
    });
  },
  async deletePost(id) { state.posts = state.posts.filter((p) => p.id !== id); },
  async setLike(postId, liked) {
    const p = state.posts.find((x) => x.id === postId);
    if (p && p.likedByMe !== liked) { p.likedByMe = liked; p.likes += liked ? 1 : -1; }
  },
  async loadComments(postId) {
    await wait();
    const p = state.posts.find((x) => x.id === postId);
    return (p ? p.comments : []).map((c) => ({ ...c, mine: c.author.id === 'me' }));
  },
  async addComment(postId, text) {
    const p = state.posts.find((x) => x.id === postId);
    p.comments.push({ id: `c${Date.now()}`, author: { id: 'me', name: state.profile.name.split(' ')[0], photo: state.profile.photo }, text, createdAt: Date.now() });
    p.commentCount = p.comments.length;
  },
  async deleteComment(id) {
    state.posts.forEach((p) => { p.comments = p.comments.filter((c) => c.id !== id); p.commentCount = p.comments.length; });
  },

  async loadLibrary() { await wait(); return libraryItems.map((it) => ({ ...it })); },
  async fileUrl() { return null; },
};
