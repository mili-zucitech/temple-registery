import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const BASE = '/api/v1'

const handlers = [
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({
      success: true,
      message: 'Login successful',
      data: { accessToken: 'mock-token', tokenType: 'Bearer', expiresIn: 3600, role: 'DISTRICT_COLLECTOR', userId: 1 },
    })
  ),

  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json({
      success: true,
      message: 'OK',
      data: {
        id: 1, username: 'testdc', email: 'dc@example.com', fullName: 'Test DC',
        role: 'DISTRICT_COLLECTOR', aadhaarVerified: true,
      },
    })
  ),

  http.post(`${BASE}/auth/logout`, () =>
    HttpResponse.json({ success: true, message: 'Logged out' })
  ),

  http.get(`${BASE}/declarations`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '0')
    return HttpResponse.json({
      success: true,
      message: 'OK',
      data: {
        content: [],
        page,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        last: true,
      },
    })
  }),

  http.get(`${BASE}/geo/states`, () =>
    HttpResponse.json({
      success: true,
      message: 'OK',
      data: [{ id: 1, name: 'Karnataka', code: 'KA' }],
    })
  ),

  // Default handler for admin/users endpoint (can be overridden in tests)
  http.get(`${BASE}/admin/users`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '0')
    const size = Number(url.searchParams.get('size') ?? '20')
    
    // Return empty response by default
    return HttpResponse.json({
      success: true,
      message: 'OK',
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size,
        number: page,
        first: true,
        last: true,
        numberOfElements: 0,
      },
    })
  }),
]

export const server = setupServer(...handlers)
