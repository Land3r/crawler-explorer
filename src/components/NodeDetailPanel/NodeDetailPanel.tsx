import { FC, useEffect, useState } from "react";

import { Panel } from "../Panel";
import { useSigma } from "@react-sigma/core";
import { Attributes } from "graphology-types";
import { BsFileEarmarkCodeExtended } from "../Icons/Icons";

const NodeDetailPanel: FC<{ node: string | null }> = ({ node }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [attributes, setAttributes] = useState<Attributes | null>(null)

  useEffect(() => {
    if (node) {
      const {hidden, ...attr} = graph.getNodeAttribute(node, 'data');
      setAttributes(attr);
    }
  }, [node])

  return (
    <Panel
      title={
        <>
          <BsFileEarmarkCodeExtended className="text-muted" /> Details
        </>
      }
      initiallyDeployed
    >
      {attributes && Object.keys(attributes).map((key) => (<p key={key}> {key}: {JSON.stringify(attributes[key])} </p>))}
    </Panel>
  );
};

export default NodeDetailPanel;