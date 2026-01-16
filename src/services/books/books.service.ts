import AsyncStorage from '@react-native-async-storage/async-storage';
import http from '../../utils/http';
// import { Api } from '../../types/api';

export interface Book {
  id: string;
  title: string;
  slogan: string;
  summary: string;
  file_path: string;
  image_path: string;
}

export interface BooksResponse {
  data: Book[];
  limit: number;
  total: number;
  pageNo: number;
}

export interface BooksApiResponse {
  status: boolean;
  message: string;
  data: BooksResponse;
}

export interface SendEmailRequest {
  path: string;
  email: string;
  user_name: string;
  title: string;
  slogan: string;
}

export interface SendEmailResponse {
  status: boolean;
  message: string;
}

export interface ViewBookResponse {
  status: boolean;
  title: string;
  book_url: string;
}

class BooksService {

  async getBooks(skip: number = 0, take: number = 10, limit: number = 10, pageNo: number = 0): Promise<BooksApiResponse> {
    try {

      const token = await AsyncStorage.getItem('USER_TOKEN');
      if (!token) {
        throw new Error('No authentication token found');
      }
    
      const response = await http.get(
        `books?skip=${skip}&take=${take}&limit=${limit}&pageNo=${pageNo}`,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        },
      );

      if (!response.status) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BooksApiResponse = await response.data;
      return data;
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  }

  async sendEmail(requestData: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      const response = await http.post(
        'books/send-email',
        requestData,
        {
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.status) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SendEmailResponse = await response.data;
      return data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async viewBook(title: string): Promise<ViewBookResponse> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Encode the title for URL
      const encodedTitle = encodeURIComponent(title);
      
      const response = await http.get(
        `mobile/view-book?title=${encodedTitle}`,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        },
      );

      if (!response.status) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ViewBookResponse = await response.data;
      return data;
    } catch (error) {
      console.error('Error fetching book URL:', error);
      throw error;
    }
  }
}

export default new BooksService();
