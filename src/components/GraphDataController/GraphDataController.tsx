import { useSigma } from "@react-sigma/core";
import { FC, PropsWithChildren, useEffect } from "react";

import { FiltersState } from "../../types";
import { extractHostname } from "../../shared/utils/url-utils";

const GraphDataController: FC<PropsWithChildren<{ filters: FiltersState }>> = ({ filters, children }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  /**
   * Apply filters to graphology:
   */
  useEffect(() => {
    const { types, domains } = filters;
    graph.forEachNode((node, { data: { type }, source}) => {
      const domain = extractHostname(source)
      graph.setNodeAttribute(node, "hidden", !types[type] || !domains[domain])
    });
  }, [graph, filters]);

  return <>{children}</>;
};

export default GraphDataController;