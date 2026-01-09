'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Branch {
  name: string;
  sha: string;
  protected: boolean;
}

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  parents: string[];
}

interface BranchGraphProps {
  commits: Commit[];
  branches: Branch[];
}

export default function BranchGraph({ commits, branches }: BranchGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || commits.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 800;
    const nodeRadius = 8;
    const nodeSpacing = 60;
    const branchSpacing = 40;
    const leftPadding = 80;
    const topPadding = 40;

    const branchShas = new Set(branches.map(b => b.sha));
    const commitMap = new Map(commits.map(c => [c.sha, c]));

    const nodePositions = new Map<string, { x: number; y: number; lane: number }>();
    const lanes: string[][] = [[]];

    const assignLane = (sha: string): number => {
      const commit = commitMap.get(sha);
      if (!commit) return 0;

      for (let i = 0; i < lanes.length; i++) {
        const lastInLane = lanes[i][lanes[i].length - 1];
        if (!lastInLane) {
          lanes[i].push(sha);
          return i;
        }

        const lastCommit = commitMap.get(lastInLane);
        if (lastCommit && commit.parents.includes(lastInLane)) {
          lanes[i].push(sha);
          return i;
        }
      }

      lanes.push([sha]);
      return lanes.length - 1;
    };

    commits.forEach((commit, index) => {
      const lane = assignLane(commit.sha);
      nodePositions.set(commit.sha, {
        x: leftPadding + lane * branchSpacing,
        y: topPadding + index * nodeSpacing,
        lane
      });
    });

    const height = topPadding * 2 + commits.length * nodeSpacing;
    svg.attr('height', height);

    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'line-gradient')
      .attr('gradientUnits', 'userSpaceOnUse');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#00ff88');

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ff6b35');

    const linesGroup = svg.append('g').attr('class', 'lines');
    const nodesGroup = svg.append('g').attr('class', 'nodes');
    const labelsGroup = svg.append('g').attr('class', 'labels');

    const laneColors = ['#00ff88', '#ff6b35', '#38bdf8', '#f472b6', '#a78bfa', '#fbbf24'];

    commits.forEach((commit) => {
      const pos = nodePositions.get(commit.sha);
      if (!pos) return;

      commit.parents.forEach((parentSha) => {
        const parentPos = nodePositions.get(parentSha);
        if (!parentPos) return;

        const path = d3.path();
        path.moveTo(pos.x, pos.y);

        if (pos.lane !== parentPos.lane) {
          const midY = (pos.y + parentPos.y) / 2;
          path.bezierCurveTo(
            pos.x, midY,
            parentPos.x, midY,
            parentPos.x, parentPos.y
          );
        } else {
          path.lineTo(parentPos.x, parentPos.y);
        }

        linesGroup.append('path')
          .attr('d', path.toString())
          .attr('class', 'branch-line')
          .attr('stroke', laneColors[pos.lane % laneColors.length])
          .attr('opacity', 0.6);
      });
    });

    commits.forEach((commit) => {
      const pos = nodePositions.get(commit.sha);
      if (!pos) return;

      const isBranchHead = branchShas.has(commit.sha);
      const branch = branches.find(b => b.sha === commit.sha);

      const nodeGroup = nodesGroup.append('g')
        .attr('class', 'graph-node')
        .attr('transform', `translate(${pos.x}, ${pos.y})`);

      nodeGroup.append('circle')
        .attr('r', isBranchHead ? nodeRadius + 2 : nodeRadius)
        .attr('fill', laneColors[pos.lane % laneColors.length])
        .attr('stroke', isBranchHead ? '#ffffff' : 'none')
        .attr('stroke-width', 2);

      if (isBranchHead && branch) {
        nodeGroup.append('rect')
          .attr('x', 15)
          .attr('y', -10)
          .attr('width', branch.name.length * 7 + 12)
          .attr('height', 20)
          .attr('rx', 4)
          .attr('fill', branch.protected ? '#854d0e' : laneColors[pos.lane % laneColors.length])
          .attr('opacity', 0.2);

        nodeGroup.append('text')
          .attr('x', 21)
          .attr('y', 4)
          .attr('fill', branch.protected ? '#fbbf24' : laneColors[pos.lane % laneColors.length])
          .attr('font-size', '11px')
          .attr('font-weight', 'bold')
          .text(branch.name);
      }

      labelsGroup.append('text')
        .attr('x', leftPadding + lanes.length * branchSpacing + 20)
        .attr('y', pos.y + 4)
        .attr('fill', '#a1a1aa')
        .attr('font-size', '11px')
        .attr('font-family', 'monospace')
        .text(`${commit.sha.substring(0, 7)} - ${commit.message.substring(0, 50)}${commit.message.length > 50 ? '...' : ''}`);
    });

  }, [commits, branches]);

  if (commits.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--terminal-text)] opacity-60">
        No commits to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <svg
        ref={svgRef}
        className="w-full min-w-[600px]"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}
