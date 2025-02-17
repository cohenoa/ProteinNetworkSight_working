import { FC, useState, useLayoutEffect, useRef } from "react";
import { ContextMenuProps } from "../@types/props";
import "../styles/ContextMenu.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const ContextMenu: FC<ContextMenuProps> = ({ position, depth, items }) => {
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [subMenuXPos, setSubMenuXPos] = useState<number>(-1); // this state is used to fix a bug of position in submenu
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const screenHeight = window.innerHeight;
      
      let dirValue = position.y + menuRect.height > screenHeight ? "up" : "down";

      if (dirValue === "up"){
        position.y = position.y - menuRect.height;
      }

    }
  }, [items.length, position.y]);

  const handleOptionMouseEnter = (label: string) => {
    setActiveSubMenu(label);
  };

  const handleOptionMouseLeave = () => {
    setActiveSubMenu(null);
  };

  const getPos = (index: Number) => {
    var element = document.getElementById("menuItem" + String(depth) + "_" + String(index));
    if (element === null){ // couldn't get element, positioning at default location
      console.log("coudn't get pos");
      return {x: position.x + 50, y: position.y + 50};
    }

    const rect = element.getBoundingClientRect();

    if (subMenuXPos === -1){ // opening submenu for the first time
      setSubMenuXPos(rect.right);
      return getOverflowPosition(
        { x: rect.right, y: position.y + rect.height * Number(index) },
        rect.height,
        items.at(index.valueOf())?.submenu?.length || 0
      );
      // return {x: rect.right, y: position.y + rect.height * Number(index)};
    }
    else{ // submenu already opened, using previous XPos to avoid taking submenu pos(render order issue)
      return getOverflowPosition(
        {x: subMenuXPos, y: position.y + rect.height * Number(index)}, 
        rect.height,
        items.at(index.valueOf())?.submenu?.length || 0
      );
      // return {x: subMenuXPos, y: position.y + rect.height * Number(index)};
    }
  }

  const getOverflowPosition = (root: { x: number; y: number }, itemHeight: number, numItems: number) => {
    let newPos = {x: root.x, y: root.y};

    let length = (itemHeight * (numItems - 1));
    if ( root.y + length + itemHeight > window.innerHeight){
      newPos.y = root.y - length;
    }
    return newPos;
  }

  return (
    <div ref={depth === 0? menuRef: undefined} style={{ top: position.y, left: position.x, zIndex: depth + 1 }} className="custom-context-menu">
      {items.map((item, index) => (
          <div
            id={"menuItem" + String(depth) + "_" + String(index)}
            key={index}
            className="option"
            onClick={item.onClick}
            onMouseEnter={() => handleOptionMouseEnter(item.label)}
            onMouseLeave={handleOptionMouseLeave}
          > 
            <FontAwesomeIcon className="icon" icon={item.icon} fixedWidth={true}></FontAwesomeIcon>
            {item.label}
            {item.submenu && (activeSubMenu === item.label || item.submenu.some((item) => {return item.label === activeSubMenu})) && (
            <ContextMenu // submenu
            position={getPos(index)}
            depth={depth + 1}
            items={item.submenu}
            />
          )}
          </div>
      ))}
    </div>
  );
};

export default ContextMenu;