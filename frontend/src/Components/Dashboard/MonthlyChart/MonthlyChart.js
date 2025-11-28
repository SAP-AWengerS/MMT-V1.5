import { DualAxes } from '@ant-design/plots';
import React, { useState, useEffect } from 'react';
import { Axios } from '../../../Config/Axios/Axios';
import { useContext } from 'react';
import { UserContext } from '../../../App';

const MonthlyChart = () => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    const { user } = useContext(UserContext);

    useEffect(() => {

        Axios.get(`/api/v1/app/metadata/getSixMonthsDataByUserId`, {
            params: {
                userId: user.userId,
            },
            headers: {
                authorization: `bearer ${localStorage.getItem("token")}`,
            },
        })
            .then((res) => {
                setChartData(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load chart data:", err);
                setLoading(false);
            });
    }, [user.id]);

    const config = {
        xField: 'time',
        legend: true,
        title: "Monthly Expenses",
        children: [
            {
                data: chartData?.expensesData,
                type: 'interval',
                yField: 'value',
                stack: true,
                colorField: 'type',
                style: {
                    maxWidth: 24,
                    radiusTopLeft: 20,
                    radiusTopRight: 20,
                    radiusBottomLeft: 0,
                    radiusBottomRight: 0,
                },
                scale: {
                    color: {
                        domain: ['Fuel', 'Def', 'Other', 'Loan'],
                        range: ['#13452d', '#5fbd92', '#227d53', '#8fd9b6'],
                    },
                    y: { key: 'key1', independent: false }
                },
                interaction: { elementHighlight: { background: true } },
            },
            {
                data: chartData?.incomeData,
                type: 'line',
                yField: 'Income',
                style: { lineWidth: 2, stroke: '#39793e' },
                scale: { y: { key: 'key1', independent: false } },
            },
        ],
    };

    if (loading) {
        return <div className='bg-white p-3 h-100 rounded-4 d-flex align-items-center justify-content-center'>Loading...</div>;
    }

    return (
        <div
            className='bg-white p-3 h-100 rounded-4'
            style={{
                background: '#fff',
                borderRadius: 12,
                padding: 30,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                minHeight: 360,
            }}
        >
            <DualAxes {...config} />
        </div>
    );
};

export default MonthlyChart;
