import axios from "axios"

const BASE_URL = "/api"

export const fetchDataFromApi = async (url, params) => {
  try {
    const { data } = await axios.get(BASE_URL + url, { params })
    return data
  } catch (err) {
    console.error("API Error:", err)
    return null
  }
}

export const postDataToApi = async (url, body) => {
  try {
    const { data } = await axios.post(BASE_URL + url, body)
    return data
  } catch (err) {
    console.error("API Error:", err)
    return null
  }
}
