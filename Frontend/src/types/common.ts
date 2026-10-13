export interface PageResult<T> {
  data: T[];
  page: number;
  limit: number;
  total?: number;
}
export interface PageParams {
  page?: number;
  limit?: number;
}
export interface ApiMessage {
  message: string;
}
