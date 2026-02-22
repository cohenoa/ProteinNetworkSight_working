import { FC } from "react";
import "../styles/Loading.css";

const LoadingBarComponent: FC<{percent: number, label: string}> = ({percent, label}) => {
  return (
    <div className="loading-wrapper">
      <p>Preparing the results.</p>
      <p>
        Please be patient, this may take a few minutes (depending on the data
        size).
      </p>
      <Progress percent={percent} label={`${percent}% - ${label}`} />
    </div>
  );
};

function Progress({ percent, label }: { percent: number; label: string }) {
  return (
    <div style={{ width: '100%', background: '#eee', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: `${percent}%`,
          background: '#4caf50',
          height: 10,
          borderRadius: 8,
          transition: 'width 0.2s',
        }}
      />
      <div style={{ marginTop: 4, fontSize: 14, marginBottom: 2 }}>
        {label} — {percent}%
      </div>
    </div>
  );
}

export default LoadingBarComponent;