import fetch from 'node-fetch';

export class XtreamClient {
  constructor(server, username, password) {
    this.server = server.replace(/\/+$/, '');
    this.username = username;
    this.password = password;
    this.baseUrl = `${this.server}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  }

  async _get(params = '') {
    const url = `${this.baseUrl}${params ? '&' + params : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Xtream API error: ${res.status}`);
    return res.json();
  }

  async getAccountInfo() {
    return this._get();
  }

  async getLiveCategories() {
    return this._get('action=get_live_categories');
  }

  async getLiveStreams(categoryId) {
    const param = categoryId ? `action=get_live_streams&category_id=${categoryId}` : 'action=get_live_streams';
    return this._get(param);
  }

  async getVodCategories() {
    return this._get('action=get_vod_categories');
  }

  async getVodStreams(categoryId) {
    const param = categoryId ? `action=get_vod_streams&category_id=${categoryId}` : 'action=get_vod_streams';
    return this._get(param);
  }

  async getSeriesCategories() {
    return this._get('action=get_series_categories');
  }

  async getSeries(categoryId) {
    const param = categoryId ? `action=get_series&category_id=${categoryId}` : 'action=get_series';
    return this._get(param);
  }

  async getSeriesInfo(seriesId) {
    return this._get(`action=get_series_info&series_id=${seriesId}`);
  }

  async getEpg(streamId) {
    return this._get(`action=get_short_epg&stream_id=${streamId}`);
  }

  async getFullEpg() {
    return this._get('action=get_simple_data_table&stream_id=all');
  }

  getLiveStreamUrl(streamId, extension = 'm3u8') {
    return `${this.server}/live/${encodeURIComponent(this.username)}/${encodeURIComponent(this.password)}/${streamId}.${extension}`;
  }

  getVodStreamUrl(streamId, extension = 'mp4') {
    return `${this.server}/movie/${encodeURIComponent(this.username)}/${encodeURIComponent(this.password)}/${streamId}.${extension}`;
  }

  getSeriesStreamUrl(streamId, extension = 'mp4') {
    return `${this.server}/series/${encodeURIComponent(this.username)}/${encodeURIComponent(this.password)}/${streamId}.${extension}`;
  }
}
