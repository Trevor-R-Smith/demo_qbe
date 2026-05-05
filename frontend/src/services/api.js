import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const http = axios.create({
    baseURL: API,
    headers: { "Content-Type": "application/json" },
});

export const submitContact = (payload) => http.post("/contact", payload).then((r) => r.data);
export const listClubs = () => http.get("/clubs").then((r) => r.data);
export const submitScore = (payload) => http.post("/score", payload).then((r) => r.data);
export const submitClubClaim = (payload) => http.post("/club-claim", payload).then((r) => r.data);
export const fetchLeaderboard = (gameType, { club, period } = {}) => {
    const params = {};
    if (club && club !== "All") params.club = club;
    if (period) params.period = period;
    return http.get(`/leaderboard/${gameType}`, { params }).then((r) => r.data);
};

export default http;
