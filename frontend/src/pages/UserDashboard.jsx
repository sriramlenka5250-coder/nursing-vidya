import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import AuthContext from '../context/AuthContext';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
    const [orders, setOrders] = useState([]);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get(`${API_URL}/api/orders/my`, config);
                setOrders(data);
            } catch (error) {
                console.error(error);
            }
        };
        if (user) fetchOrders();
    }, [user]);

    const downloadHandler = async (id, title) => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
                responseType: 'blob',
            };
            const response = await axios.get(`${API_URL}/api/pdfs/download/${id}`, config);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${title}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            alert('Error downloading file');
        }
    };

    return (
        <div className="min-h-screen pt-28 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">My Library</h1>
                        <p className="mt-1 text-slate-500 dark:text-slate-400">Access all your purchased study materials.</p>
                    </div>
                </div>

                <div className="glass-card rounded-2xl overflow-hidden shadow-lg">
                    {orders.length === 0 ? (
                        <div className="text-center py-20">
                            <span className="text-4xl block mb-4">📚</span>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">No notes yet</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">Start your learning journey today.</p>
                            <Link to="/" className="btn-primary inline-block">Browse Store</Link>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                            {orders.map((order) => (
                                <li key={order._id} className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center space-x-3 sm:space-x-4">
                                            <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-lg sm:text-xl">
                                                📝
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 truncate">{order.pdfId?.title || 'Unknown Note'}</p>
                                                <div className="flex flex-wrap items-center text-xs text-slate-500 dark:text-slate-400 mt-1 gap-1 sm:gap-2">
                                                    <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                                                    <span className="hidden sm:inline">•</span>
                                                    <span>ID: #{order._id.slice(-6).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-row sm:flex-row items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                            {order.status === 'approved' ? (
                                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center whitespace-nowrap">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                                                    Ready
                                                </span>
                                            ) : order.status === 'pending' ? (
                                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 whitespace-nowrap">
                                                    Pending Approval
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200 whitespace-nowrap">
                                                    Rejected
                                                </span>
                                            )}

                                            {order.status === 'approved' && order.pdfId && (
                                                <button
                                                    onClick={() => downloadHandler(order.pdfId._id, order.pdfId.title)}
                                                    className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-200 dark:hover:border-primary-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center whitespace-nowrap"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                                    Download PDF
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
