import { FC, useState, useLayoutEffect, useRef } from "react";
import { ContextMenuProps } from "../@types/props";
import "../styles/ContextMenu.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const ContextMenu: FC<ContextMenuProps> = ({ position, depth, items }) => {
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [subMenuXPos, setSubMenuXPos] = useState<number>(-1); // this state is used to fix a bug of position in submenu
  const [HorizontalMenuDirection, setHorizontalMenuDirection] = useState<string>("right");
  const [VerticalMenuDirection, setVerticalMenuDirection] = useState<string>("down");
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    console.log("window height: ", window.innerHeight);
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const screenHeight = window.innerHeight;
      console.log("menu rect: " + menuRect.bottom + " " + menuRect.right);
      
      // If the menu overflows the bottom, reverse the order
      let dirValue = menuRect.bottom > screenHeight ? "up" : "down";
      setVerticalMenuDirection(dirValue);
      // setVerticalMenuDirection(menuRect.bottom > screenHeight ? "up" : "down");
      console.log("menu vertical direction: " + dirValue);
      console.log("menu vertical direction: " + VerticalMenuDirection);

    }
  }, [items.length]);

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
      return {x: rect.right, y: position.y + rect.height * Number(index)};
    }
    else{ // submenu already opened, using previous XPos to avoid taking submenu pos(render order issue)
      return {x: subMenuXPos, y: position.y + rect.height * Number(index)};
    }
  }

  return (
    <div ref={menuRef} style={{ top: position.y, left: position.x }} className="custom-context-menu">
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