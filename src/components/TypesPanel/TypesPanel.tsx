import { useSigma } from "@react-sigma/core";
import { keyBy, mapValues, sortBy, values } from "lodash";
import { FC, useEffect, useMemo, useState } from "react";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

import { Type, FiltersState } from "../../types";
import { Panel } from "../Panel";
import { MdGroupWorkExtended } from "../Icons/Icons";

const TypesPanel: FC<{
  types: Type[];
  filters: FiltersState;
  toggleType: (type: string) => void;
  setTypes: (types: Record<string, boolean>) => void;
}> = ({ types, filters, toggleType, setTypes }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  const nodesPerType = useMemo(() => {
    const index: Record<string, number> = {};
    graph.forEachNode((_, { type }) => (index[type] = (index[type] || 0) + 1));
    return index;
  }, []);

  const maxNodesPerType = useMemo(() => Math.max(...values(nodesPerType)), [nodesPerType]);
  const visibleTypesCount = useMemo(() => Object.keys(filters.types).length, [filters]);

  const [visibleNodesPerType, setVisibleNodesPerType] = useState<Record<string, number>>(nodesPerType);
  useEffect(() => {
    // To ensure the graphology instance has up to data "hidden" values for
    // nodes, we wait for next frame before reindexing. This won't matter in the
    // UX, because of the visible nodes bar width transition.
    requestAnimationFrame(() => {
      const index: Record<string, number> = {};
      graph.forEachNode((_, { type, hidden }) => !hidden && (index[type] = (index[type] || 0) + 1));
      setVisibleNodesPerType(index);
    });
  }, [filters]);

  const sortedTypes = useMemo(
    () => sortBy(types, (type) => -nodesPerType[type.key]),
    [types, nodesPerType],
  );

  return (
    <Panel
      title={
        <>
          <MdGroupWorkExtended className="text-muted" /> Types
          {visibleTypesCount < types.length ? (
            <span className="text-muted text-small">
              {" "}
              ({visibleTypesCount} / {types.length})
            </span>
          ) : (
            ""
          )}
        </>
      }
    >
      <p>
        <i className="text-muted">Click a type to show/hide related pages from the network.</i>
      </p>
      <p className="buttons">
        <button className="btn" onClick={() => setTypes(mapValues(keyBy(types, "key"), () => true))}>
          <AiOutlineCheckCircle /> Check all
        </button>{" "}
        <button className="btn" onClick={() => setTypes({})}>
          <AiOutlineCloseCircle /> Uncheck all
        </button>
      </p>
      <ul>
        {sortedTypes.map((type) => {
          const nodesCount = nodesPerType[type.key];
          const visibleNodesCount = visibleNodesPerType[type.key] || 0;
          return (
            <li
              className="caption-row"
              onClick={() => toggleType(type.key)}
              key={type.key}
              title={`${nodesCount} page${nodesCount > 1 ? "s" : ""}${
                visibleNodesCount !== nodesCount
                  ? visibleNodesCount > 0
                    ? ` (only ${visibleNodesCount > 1 ? `${visibleNodesCount} are` : "one is"} visible)`
                    : " (all hidden)"
                  : ""
              }`}
            >
              <input
                type="checkbox"
                checked={filters.types[type.key] || false}
                onChange={() => toggleType(type.key)}
                id={`type-${type.key}`}
              />
              <label htmlFor={`type-${type.key}`}>
                <span className="circle" style={{ background: type.color, borderColor: type.color }} />{" "}
                <div className="node-label">
                  <span className="capitalize">{type.typeLabel}</span>
                  <div className="bar" style={{ width: (100 * nodesCount) / maxNodesPerType + "%" }}>
                    <div
                      className="inside-bar"
                      style={{
                        width: (100 * visibleNodesCount) / nodesCount + "%",
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

export default TypesPanel;