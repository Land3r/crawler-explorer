import { useSigma } from "@react-sigma/core";
import { keyBy, mapValues, sortBy, values } from "lodash";
import { FC, useEffect, useMemo, useState } from "react";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

import { Domain, FiltersState } from "../../types";
import { Panel } from "../Panel";
import { extractHostname } from "../../shared/utils/url-utils";
import { BiRadarExtended } from "../Icons/Icons";

const DomainsPanel: FC<{
  domains: Domain[];
  filters: FiltersState;
  toggleDomain: (type: string) => void;
  setDomains: (types: Record<string, boolean>) => void;
}> = ({ domains, filters, toggleDomain, setDomains }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  const nodesPerDomain = useMemo(() => {
    const index: Record<string, number> = {};
    graph.forEachNode((_, { source }) => {
      const domain = extractHostname(source);
      index[domain] = (index[domain] || 0) + 1;
    })
    return index;
  }, [graph]);

  const maxNodesPerDomain = useMemo(() => Math.max(...values(nodesPerDomain)), [nodesPerDomain]);
  const visibleDomainsCount = useMemo(() => Object.keys(filters.domains).length, [filters]);

  const [visibleNodesPerDomain, setVisibleNodesPerDomain] = useState<Record<string, number>>(nodesPerDomain);
  useEffect(() => {
    // To ensure the graphology instance has up to data "hidden" values for
    // nodes, we wait for next frame before reindexing. This won't matter in the
    // UX, because of the visible nodes bar width transition.
    requestAnimationFrame(() => {
      const index: Record<string, number> = {};
      graph.forEachNode((_, { type, hidden }) => !hidden && (index[type] = (index[type] || 0) + 1));
      setVisibleNodesPerDomain(index);
    });
  }, [filters, graph]);

  const sortedDomains = useMemo(
    () => sortBy(domains, (domain) => -nodesPerDomain[domain.key]),
    [domains, nodesPerDomain],
  );

  return (
    <Panel
      title={
        <>
          <BiRadarExtended className="text-muted" /> Domains
          {visibleDomainsCount < domains.length ? (
            <span className="text-muted text-small">
              {" "}
              ({visibleDomainsCount} / {domains.length})
            </span>
          ) : (
            ""
          )}
        </>
      }
    >
      <p>
        <i className="text-muted">Click a domain to show/hide related pages from the network.</i>
      </p>
      <p className="panel-buttons">
        <button className="btn" onClick={() => setDomains(mapValues(keyBy(domains, "key"), () => true))}>
          <AiOutlineCheckCircle /> Check all
        </button>{" "}
        <button className="btn" onClick={() => setDomains({})}>
          <AiOutlineCloseCircle /> Uncheck all
        </button>
      </p>
      <ul>
        {sortedDomains.map((domain) => {
          const domainsCount = nodesPerDomain[domain.key];
          const visibleDomainsCount = visibleNodesPerDomain[domain.key] || 0;
          return (
            <li
              className="caption-row"
              onClick={() => toggleDomain(domain.key)}
              key={domain.key}
              title={`${domainsCount} page${domainsCount > 1 ? "s" : ""}${
                visibleDomainsCount !== domainsCount
                  ? visibleDomainsCount > 0
                    ? ` (only ${visibleDomainsCount > 1 ? `${visibleDomainsCount} are` : "one is"} visible)`
                    : " (all hidden)"
                  : ""
              }`}
            >
              <input
                type="checkbox"
                checked={filters.domains[domain.key] || false}
                onChange={() => toggleDomain(domain.key)}
                id={`domain-${domain.key}`}
              />
              <label htmlFor={`domain-${domain.key}`}>
                <span className="circle" style={{ background: domain.color, borderColor: domain.color }} />{" "}
                <div className="node-label">
                  <span className="capitalize">{domain.domainLabel}</span>
                  <div className="bar" style={{ width: (100 * domainsCount) / maxNodesPerDomain + "%" }}>
                    <div
                      className="inside-bar"
                      style={{
                        width: (100 * visibleDomainsCount) / domainsCount + "%",
                      }}
                    />
                  </div>
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
};

export default DomainsPanel;