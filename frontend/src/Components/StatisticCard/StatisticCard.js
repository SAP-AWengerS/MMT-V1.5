import { Card, Statistic } from 'antd'
import { useNavigate } from 'react-router-dom';
import { ArrowUpRightIcon } from '@primer/octicons-react';

const StatisticCard = (props) => {

  const nav = useNavigate()

  return (
    <Card hoverable bordered={false} className={props.cardType === "primary" ? "primary rounded-4" : "rounded-4"} onClick={() => { props.route && nav(props.route) }}>
      <div className='d-flex align-items-center justify-content-between'>
        <Statistic
          title={
            <div className='w-100 d-flex justify-content-between align-items-center'>
              <b className='d-flex gap-2'>
                <span style={{ fontSize: 16, fontWeight: 500, color: props.cardType === 'primary' ? "#fff" : "#000" }}>
                  {props.title}
                </span>
                {
                  props.subtitle &&
                  <div style={{ fontSize: 11, fontWeight: 500, color: props.cardType === 'primary' ? "white" : "#000", background: props.cardType === 'primary' ? "#fff" : "#E0F8E9", padding: "2px 6px", borderRadius: 4, width: "max-content" }}>
                    {props.subtitle}
                  </div>
                }
              </b>
              {
                props.route &&
                <div className='d-flex align-items-center justify-content-center' style={{ height: 30, width: 30, borderRadius: "100%", background: props.cardType === 'primary' ? "#fff" : "#158141" }}>
                  <ArrowUpRightIcon size={16} fill={props.cardType === 'primary' ? "#158141" : "#fff"} />
                </div>
              }
            </div>
          }
          value={props.value}
          className='w-100'
          precision={2}
          formatter={(value) => {
            if (value >= 10000000) {
              // 1 crore or more
              return `${(value / 10000000).toFixed(2)}Cr`;
            } else if (value >= 100000) {
              // 1 lakh or more
              return `${(value / 100000).toFixed(2)}L`;
            } else {
              return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
            }
          }}
          valueStyle={{
            color: props.cardType === "primary" ? '#fff' : '#000',
            fontWeight: 460,
            fontSize: 46
          }}
        />
        {/* <Statistic
        //   title={props.title}
          value={props.thisMonth}
          prefix={<ArrowUpOutlined />}
          precision={0}
          valueStyle={{
            color: '#fff',
            fontWeight: 800,
            fontSize:16
          }}
          /> */}
      </div>
    </Card>
  )
}

export default StatisticCard