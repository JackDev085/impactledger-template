const API_BASE_URL = typeof window !== 'undefined' && window.location.origin.includes('localhost')
  ? 'http://localhost:5000/api'
  : '/api';

// Helper to get auth header
const getAuthHeaders = () => {
  const token = localStorage.getItem('skillchain_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const handleResponse = async (res) => {
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong')
  }
  return data
}

export const apiService = {
  // Authentication
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await handleResponse(res)
      if (data.token) {
        localStorage.setItem('skillchain_token', data.token)
        localStorage.setItem('skillchain_user', JSON.stringify(data.user))
      }
      return data
    },

    register: async (username, email, password, role, walletAddress) => {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role, walletAddress })
      })
      return handleResponse(res)
    },

    logout: () => {
      localStorage.removeItem('skillchain_token')
      localStorage.removeItem('skillchain_user')
    },

    getCurrentUser: () => {
      try {
        const userStr = localStorage.getItem('skillchain_user')
        return userStr ? JSON.parse(userStr) : null
      } catch {
        return null
      }
    }
  },

  // Admin Panel
  admin: {
    getInstitutions: async () => {
      const res = await fetch(`${API_BASE_URL}/admin/institutions`, {
        headers: { ...getAuthHeaders() }
      })
      return handleResponse(res)
    },

    approveInstitution: async (id) => {
      const res = await fetch(`${API_BASE_URL}/admin/institutions/${id}/approve`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      })
      return handleResponse(res)
    },

    deactivateInstitution: async (id) => {
      const res = await fetch(`${API_BASE_URL}/admin/institutions/${id}/deactivate`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      })
      return handleResponse(res)
    }
  },

  // Institution Panel
  institution: {
    getCourses: async () => {
      const res = await fetch(`${API_BASE_URL}/institution/courses`, {
        headers: { ...getAuthHeaders() }
      })
      return handleResponse(res)
    },

    createCourse: async (title, description, workloadHours) => {
      const res = await fetch(`${API_BASE_URL}/institution/courses`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ title, description, workloadHours })
      })
      return handleResponse(res)
    },

    issueCertificate: async (studentEmail, studentName, courseId, certificateHash, transactionHash) => {
      const res = await fetch(`${API_BASE_URL}/institution/certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ studentEmail, studentName, courseId, certificateHash, transactionHash })
      })
      return handleResponse(res)
    },

    getIssuedCertificates: async () => {
      const res = await fetch(`${API_BASE_URL}/institution/certificates`, {
        headers: { ...getAuthHeaders() }
      })
      return handleResponse(res)
    },

    revokeCertificate: async (id) => {
      const res = await fetch(`${API_BASE_URL}/institution/certificates/${id}/revoke`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      })
      return handleResponse(res)
    }
  },

  // Student Panel
  student: {
    getDashboard: async () => {
      const res = await fetch(`${API_BASE_URL}/student/dashboard`, {
        headers: { ...getAuthHeaders() }
      })
      return handleResponse(res)
    },
    getCertificates: async () => {
      const res = await fetch(`${API_BASE_URL}/student/certificates`, {
        headers: { ...getAuthHeaders() }
      })
      return handleResponse(res)
    }
  },

  // Public Verify
  verify: {
    check: async (id) => {
      const res = await fetch(`${API_BASE_URL}/verify/${id}`)
      return handleResponse(res)
    }
  }
}
