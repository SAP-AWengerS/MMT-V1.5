import { Empty } from 'antd';
import React from 'react'
import { useState } from 'react'

const SchedulerWidget = () => {

  const [hasScheduled, setHasScheduled] = useState(false);

  return (
    <div
      style={{
        background: '#fff',
        height: '100%',
        borderRadius: 12,
        padding: 30,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <h3 style={{
        marginBottom: 12,
        fontWeight: 600,
        fontSize: 18,
        color: "#333"
      }}>
        Scheduler
      </h3>

      {hasScheduled ? (
        <b>hi</b>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No schedules available"
        />
      )}
    </div>
  )
}

export default SchedulerWidget
